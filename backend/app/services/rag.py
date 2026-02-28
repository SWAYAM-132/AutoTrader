import hashlib
import logging
from datetime import datetime
from typing import Any, Dict, List

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── ChromaDB Client ─────────────────────────────────────────────────────────
# Prefer HTTP client (persistent, Docker service) over in-memory.
VECTOR_DB_AVAILABLE = False
_collection = None

try:
    import chromadb

    # Try HTTP client first (Docker ChromaDB service)
    try:
        _chroma_client = chromadb.HttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )
        _chroma_client.heartbeat()  # Test connection
        _collection = _chroma_client.get_or_create_collection(
            name="autotraderx_knowledge",
            metadata={"hnsw:space": "cosine"},
        )
        VECTOR_DB_AVAILABLE = True
        logger.info(
            "ChromaDB HTTP client connected at %s:%s (persistent mode)",
            settings.CHROMA_HOST, settings.CHROMA_PORT,
        )
    except Exception as http_err:
        logger.warning("ChromaDB HTTP connection failed (%s), falling back to in-memory", http_err)
        # Fallback to in-memory client
        try:
            from chromadb.config import Settings as ChromaSettings
            _chroma_client = chromadb.Client(ChromaSettings(anonymized_telemetry=False))
            _collection = _chroma_client.get_or_create_collection(
                name="autotraderx_knowledge",
                metadata={"hnsw:space": "cosine"},
            )
            VECTOR_DB_AVAILABLE = True
            logger.info("ChromaDB in-memory client initialized (non-persistent)")
        except Exception as mem_err:
            logger.error("ChromaDB in-memory also failed: %s", mem_err)

except ImportError:
    logger.warning(
        "chromadb not installed — RAG will use basic in-memory search. "
        "Install with: pip install chromadb sentence-transformers"
    )

# ─── Embedding model ────────────────────────────────────────────────────────────
_embedding_model = None


def _get_embedding_model():
    """Lazy-load the sentence-transformers model."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded embedding model: all-MiniLM-L6-v2")
        except ImportError:
            logger.warning("sentence-transformers not installed, using ChromaDB default embeddings")
    return _embedding_model


def _embed_texts(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of texts."""
    model = _get_embedding_model()
    if model is not None:
        embeddings = model.encode(texts, show_progress_bar=False)
        return embeddings.tolist()
    return []


class RAGService:
    def __init__(self):
        # Fallback in-memory store for when ChromaDB is not available
        self._documents: List[Dict[str, Any]] = []

    def _content_hash(self, text: str) -> str:
        return hashlib.md5(text.encode("utf-8")).hexdigest()

    def get_stats(self) -> Dict[str, Any]:
        """Return statistics about the RAG store."""
        if VECTOR_DB_AVAILABLE and _collection is not None:
            count = _collection.count()
            # Get a sample of recent documents
            sample = []
            if count > 0:
                try:
                    result = _collection.peek(limit=min(5, count))
                    if result and result.get("documents"):
                        for i, doc in enumerate(result["documents"]):
                            meta = result["metadatas"][i] if result.get("metadatas") else {}
                            sample.append({
                                "content_preview": doc[:200] + "..." if len(doc) > 200 else doc,
                                "metadata": meta,
                            })
                except Exception as e:
                    logger.warning("Error peeking ChromaDB: %s", e)

            return {
                "backend": "chromadb",
                "persistent": "http" in str(type(_chroma_client)).lower(),
                "collection": "autotraderx_knowledge",
                "document_count": count,
                "sample_documents": sample,
            }
        else:
            return {
                "backend": "in-memory",
                "persistent": False,
                "document_count": len(self._documents),
                "sample_documents": [
                    {
                        "content_preview": d.get("content", "")[:200],
                        "metadata": d.get("metadata", {}),
                    }
                    for d in self._documents[:5]
                ],
            }

    def get_documents(self, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
        """Return paginated list of all documents in the RAG store."""
        if VECTOR_DB_AVAILABLE and _collection is not None:
            total = _collection.count()
            if total == 0:
                return {"total": 0, "limit": limit, "offset": offset, "documents": []}

            try:
                # ChromaDB get() supports limit and offset
                result = _collection.get(
                    limit=limit,
                    offset=offset,
                    include=["documents", "metadatas"],
                )
                documents = []
                if result and result.get("documents"):
                    for i, doc in enumerate(result["documents"]):
                        meta = result["metadatas"][i] if result.get("metadatas") else {}
                        documents.append({
                            "id": result["ids"][i] if result.get("ids") else None,
                            "content": doc,
                            "metadata": meta,
                        })

                return {
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                    "documents": documents,
                }
            except Exception as e:
                logger.error("Error getting ChromaDB documents: %s", e)
                return {"total": total, "limit": limit, "offset": offset, "documents": [], "error": str(e)}
        else:
            total = len(self._documents)
            page = self._documents[offset:offset + limit]
            return {
                "total": total,
                "limit": limit,
                "offset": offset,
                "documents": [
                    {
                        "content": d.get("content", ""),
                        "metadata": d.get("metadata", {}),
                    }
                    for d in page
                ],
            }

    def ingest(self, docs: List[Dict[str, Any]]):
        """
        Ingest documents from n8n or other sources.
        Expected format: { "content": str, "metadata": dict }
        """
        if not docs:
            return

        if VECTOR_DB_AVAILABLE and _collection is not None:
            ids = []
            documents = []
            metadatas = []

            for doc in docs:
                content = doc.get("content", "")
                metadata = doc.get("metadata", {})
                title = metadata.get("title", "")
                full_text = f"{title} {content}".strip()

                if not full_text:
                    continue

                doc_id = self._content_hash(full_text)

                # Skip duplicates
                try:
                    existing = _collection.get(ids=[doc_id])
                    if existing and existing["ids"]:
                        continue
                except Exception:
                    pass

                ids.append(doc_id)
                documents.append(full_text)

                # ChromaDB metadata must be flat strings/numbers/bools
                flat_metadata = {
                    "title": str(metadata.get("title", "")),
                    "source": str(metadata.get("source", "")),
                    "url": str(metadata.get("url", "")),
                    "published_at": str(metadata.get("published_at", "")),
                    "ingested_at": datetime.now().isoformat(),
                }
                metadatas.append(flat_metadata)

            if ids:
                # Use custom embeddings if model available, else let ChromaDB handle it
                embeddings = _embed_texts(documents)
                if embeddings:
                    _collection.add(
                        ids=ids,
                        documents=documents,
                        metadatas=metadatas,
                        embeddings=embeddings,
                    )
                else:
                    _collection.add(
                        ids=ids,
                        documents=documents,
                        metadatas=metadatas,
                    )

                logger.info(
                    "RAG: Ingested %d documents into ChromaDB (total: %d)",
                    len(ids), _collection.count(),
                )
        else:
            # Fallback: in-memory store
            for doc in docs:
                doc["ingested_at"] = datetime.now().isoformat()
                self._documents.append(doc)
            logger.info(
                "RAG: Ingested %d documents in-memory (total: %d)",
                len(docs), len(self._documents),
            )

    def ingest_news_from_service(self):
        """Pull latest news from the news service and ingest into RAG store."""
        try:
            from app.services.news import news_service
            news_items = news_service.fetch_latest_news(min_relevance=0.15)

            if not news_items:
                logger.info("RAG: No news items to ingest")
                return 0

            docs = []
            for item in news_items:
                docs.append({
                    "content": f"{item.get('summary', '')}",
                    "metadata": {
                        "title": item.get("title", ""),
                        "source": item.get("source", ""),
                        "url": item.get("link", ""),
                        "published_at": str(item.get("published_at", "")),
                        "sentiment": item.get("sentiment", "Neutral"),
                        "relevance_score": str(item.get("relevance_score", 0)),
                    },
                })

            self.ingest(docs)
            logger.info("RAG: Auto-ingested %d news articles", len(docs))
            return len(docs)

        except Exception as e:
            logger.error("RAG auto-ingest failed: %s", e)
            return 0

    def retrieve(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top-k documents relevant to the query."""
        if VECTOR_DB_AVAILABLE and _collection is not None:
            return self._retrieve_chromadb(query, k)
        return self._retrieve_fallback(query, k)

    def _retrieve_chromadb(self, query: str, k: int) -> List[Dict[str, Any]]:
        """Vector-based retrieval using ChromaDB."""
        if _collection.count() == 0:
            return []

        # Use custom embeddings if model available
        query_embedding = _embed_texts([query])

        try:
            if query_embedding:
                results = _collection.query(
                    query_embeddings=query_embedding,
                    n_results=min(k, _collection.count()),
                )
            else:
                results = _collection.query(
                    query_texts=[query],
                    n_results=min(k, _collection.count()),
                )
        except Exception as e:
            logger.error("ChromaDB query error: %s", e)
            return []

        documents = []
        if results and results["documents"]:
            for i, doc_text in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results.get("distances") else 0
                documents.append({
                    "content": doc_text,
                    "metadata": metadata,
                    "relevance_score": round(1.0 - distance, 3),
                })

        return documents

    def _retrieve_fallback(self, query: str, k: int) -> List[Dict[str, Any]]:
        """Basic keyword-based retrieval as fallback."""
        import re
        import math
        from collections import Counter

        def tokenize(text: str) -> List[str]:
            return re.findall(r'\w+', text.lower())

        def cosine_similarity(vec1: Counter, vec2: Counter) -> float:
            intersection = set(vec1.keys()) & set(vec2.keys())
            numerator = sum(vec1[x] * vec2[x] for x in intersection)
            sum1 = sum(vec1[x] ** 2 for x in vec1.keys())
            sum2 = sum(vec2[x] ** 2 for x in vec2.keys())
            denominator = math.sqrt(sum1) * math.sqrt(sum2)
            if not denominator:
                return 0.0
            return float(numerator) / denominator

        query_vec = Counter(tokenize(query))
        scored_docs = []

        for doc in self._documents:
            content = doc.get("content", "")
            title = doc.get("metadata", {}).get("title", "")
            full_text = f"{title} {content}"

            doc_vec = Counter(tokenize(full_text))
            score = cosine_similarity(query_vec, doc_vec)
            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:k]]

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Heuristic-based sentiment analysis."""
        lower_text = text.lower()
        positive_keywords = [
            "surge", "growth", "record", "bullish", "upgrade", "partnership",
            "breakthrough", "profit", "rally", "rebound", "beat", "outperform",
            "strong", "gain", "soar", "exceed",
        ]
        negative_keywords = [
            "plunge", "decline", "bearish", "downgrade", "lawsuit", "bankruptcy",
            "loss", "crash", "miss", "weak", "default", "layoff", "fraud",
            "underperform", "selloff", "recession",
        ]

        pos_count = sum(1 for w in positive_keywords if w in lower_text)
        neg_count = sum(1 for w in negative_keywords if w in lower_text)

        score = 50 + (pos_count * 10) - (neg_count * 10)
        score = max(0, min(100, score))

        prediction = "Neutral"
        if score > 60:
            prediction = "Bullish"
        if score < 40:
            prediction = "Bearish"

        return {
            "score": score,
            "prediction": prediction,
            "reasoning": (
                f"Detected {pos_count} positive signals and "
                f"{neg_count} negative signals in the text."
            ),
        }


rag_service = RAGService()
