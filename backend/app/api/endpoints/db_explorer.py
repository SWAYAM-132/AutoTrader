"""
Database explorer and RAG stats endpoints.
Allows viewing database tables and RAG store contents for debugging/monitoring.
"""
import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.rag import rag_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/tables")
async def list_tables(
    session: AsyncSession = Depends(get_session),
) -> Any:
    """List all tables in the database with their column info."""
    try:
        # Use raw SQL to get table info (async-compatible)
        result = await session.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name"
            )
        )
        tables = [row[0] for row in result.fetchall()]

        table_info = []
        for table_name in tables:
            # Get column info
            col_result = await session.execute(
                text(
                    "SELECT column_name, data_type, is_nullable "
                    "FROM information_schema.columns "
                    "WHERE table_schema = 'public' AND table_name = :tbl "
                    "ORDER BY ordinal_position"
                ),
                {"tbl": table_name},
            )
            columns = [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2] == "YES",
                }
                for row in col_result.fetchall()
            ]

            # Get row count
            count_result = await session.execute(
                text(f'SELECT COUNT(*) FROM "{table_name}"')
            )
            row_count = count_result.scalar()

            table_info.append({
                "table_name": table_name,
                "columns": columns,
                "row_count": row_count,
            })

        return {"tables": table_info}
    except Exception as e:
        logger.error("Error listing tables: %s", e)
        return {"error": str(e), "tables": []}


@router.get("/tables/{table_name}")
async def get_table_data(
    table_name: str,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> Any:
    """Get paginated data from a specific table."""
    # Validate table exists
    check = await session.execute(
        text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema = 'public' AND table_name = :tbl"
        ),
        {"tbl": table_name},
    )
    if not check.fetchone():
        return {"error": f"Table '{table_name}' not found"}

    try:
        # Get total count
        count_result = await session.execute(
            text(f'SELECT COUNT(*) FROM "{table_name}"')
        )
        total = count_result.scalar()

        # Get data
        result = await session.execute(
            text(f'SELECT * FROM "{table_name}" LIMIT :lim OFFSET :off'),
            {"lim": limit, "off": offset},
        )
        rows = result.fetchall()
        columns = list(result.keys())

        data = [dict(zip(columns, row)) for row in rows]

        return {
            "table_name": table_name,
            "total_rows": total,
            "limit": limit,
            "offset": offset,
            "columns": columns,
            "data": data,
        }
    except Exception as e:
        logger.error("Error fetching table data: %s", e)
        return {"error": str(e)}


@router.get("/rag/stats")
async def get_rag_stats() -> Any:
    """Get statistics about the RAG vector store."""
    return rag_service.get_stats()


@router.get("/rag/documents")
async def get_rag_documents(
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
) -> Any:
    """Browse all documents in the RAG vector store with pagination."""
    return rag_service.get_documents(limit=limit, offset=offset)


@router.post("/rag/ingest-news")
async def trigger_news_ingest() -> Any:
    """Manually trigger news ingestion into RAG store."""
    count = rag_service.ingest_news_from_service()
    return {
        "status": "success",
        "ingested_count": count,
        "total_documents": rag_service.get_stats().get("document_count", 0),
    }
