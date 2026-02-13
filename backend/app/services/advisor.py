from app.core.llm import get_llm
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.services.market_data import market_service
from app.services.news import news_service
import logging
import json

logger = logging.getLogger(__name__)

class AdvisorService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = get_llm()
        return self._llm

    async def analyze(self, query: str, context: str = "") -> str:
        # Auto-enrich context if query mentions a symbol or general market
        enriched_context = context
        
        # Simple heuristic: look for uppercase symbols (e.g., AAPL)
        import re
        symbols = re.findall(r'\b[A-Z]{1,5}\b', query)
        
        market_info = []
        if symbols:
            for symbol in symbols:
                price = await market_service.get_stock_price(symbol)
                if price:
                    market_info.append(price)
                hist = await market_service.get_historical_data(symbol)
                if hist:
                    market_info.append({"trend_summary": hist["summary"]})

        news = news_service.fetch_latest_news(limit=5)
        if news:
            enriched_context += "\nLatest Market News:\n" + json.dumps(news, indent=2, default=str)
        
        if market_info:
            enriched_context += "\nReal-time Market Data:\n" + json.dumps(market_info, indent=2)

        system_prompt = """You are an expert financial advisor named "AutoTraderX AI".
        Your goal is to provide insightful, data-backed investment analysis.
        
        Current Context (Market Data & News):
        {context}
        
        Instructions:
        1. **Format your response using Markdown**. Use bold text for key terms and bullet points for lists.
        2. Predict trends based on the current news feed and historical data provided.
        3. Provide actionable suggestions (e.g., "Consider watching resistance at $X").
        4. Maintain a professional, data-driven tone.
        5. Always mention that this is **NOT financial advice**.
        6. If news sentiment is overwhelmingly positive/negative, incorporate that into your prediction.
        
        Example Structure:
        ### 📈 Market Analysis: [Ticker]
        - **Current Price**: [Price]
        - **Trend**: [Description]
        
        ### 📰 News & Sentiment
        - [Important News 1]
        - [Important News 2]
        
        ### 💡 Recommendation
        - [Actionable Insights]
        
        *Disclaimer: This is not financial advice.*
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{query}")
        ])
        
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            response = await chain.ainvoke({"query": query, "context": enriched_context})
            return response
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            return "I apologize, but I'm having trouble connecting to my brain right now. Please try again later."

advisor_service = AdvisorService()
