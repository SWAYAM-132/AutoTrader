"""
AutoTraderX — Training Data Preparation for QLoRA Fine-Tuning

Generates instruction-tuning data from financial news, market data,
and advisor-style responses in Alpaca format for QLoRA training.

Usage:
    python prepare_data.py --output training_data.jsonl --num-samples 500
"""

import argparse
import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path


# ─── Sample financial scenarios for data generation ────────────────────────────

TICKERS = [
    ("BTC", "Bitcoin"), ("ETH", "Ethereum"), ("NVDA", "NVIDIA"),
    ("AAPL", "Apple"), ("TSLA", "Tesla"), ("MSFT", "Microsoft"),
    ("GOOGL", "Google"), ("AMZN", "Amazon"), ("META", "Meta"),
    ("SOL", "Solana"), ("SPY", "S&P 500"),
]

MARKET_SCENARIOS = [
    {
        "condition": "bullish",
        "news_templates": [
            "{company} reports record quarterly earnings, beating estimates by 15%",
            "{company} announces major partnership with leading tech firm",
            "Analysts upgrade {ticker} to 'Strong Buy' with {pct}% upside target",
            "{company} sees surge in institutional buying activity",
            "Breaking: {company} launches revolutionary new product line",
        ],
        "sentiment": "Bullish",
        "price_direction": "up",
    },
    {
        "condition": "bearish",
        "news_templates": [
            "{company} faces regulatory scrutiny from SEC investigation",
            "{company} misses earnings expectations, revenue declines {pct}%",
            "Analysts downgrade {ticker} citing weakening fundamentals",
            "{company} announces significant layoffs amid restructuring",
            "Breaking: {company} loses key patent lawsuit, stock plummets",
        ],
        "sentiment": "Bearish",
        "price_direction": "down",
    },
    {
        "condition": "neutral",
        "news_templates": [
            "{company} trading sideways as market awaits Fed decision",
            "{company} reports mixed quarterly results, in-line with expectations",
            "Analysts maintain 'Hold' rating on {ticker} amid market uncertainty",
            "{company} announces routine executive appointment",
            "{ticker} consolidating near key support level",
        ],
        "sentiment": "Neutral",
        "price_direction": "flat",
    },
]

ANALYSIS_TEMPLATES = {
    "bullish": """### 📈 Market Analysis: {ticker} ({company})

- **Current Price**: ${price:,.2f}
- **24h Change**: +{change:.1f}%
- **Trend**: Strong upward momentum

### 📰 News & Sentiment
- **Overall Sentiment**: Bullish (based on {article_count} articles)
- {headline_1}
- {headline_2}

### 💡 Recommendation
- **Signal**: Strong Buy
- The combination of positive earnings surprise and institutional buying suggests continued upside potential
- Consider entries near ${support:,.2f} support with targets at ${target:,.2f}
- Set stop-loss at ${stop_loss:,.2f} to manage risk

*Disclaimer: This is not financial advice. Always do your own research before making investment decisions.*""",

    "bearish": """### 📉 Market Analysis: {ticker} ({company})

- **Current Price**: ${price:,.2f}
- **24h Change**: -{change:.1f}%
- **Trend**: Downward pressure increasing

### 📰 News & Sentiment
- **Overall Sentiment**: Bearish (based on {article_count} articles)
- {headline_1}
- {headline_2}

### 💡 Recommendation
- **Signal**: Caution / Reduce Exposure
- Multiple negative catalysts suggest continued selling pressure
- Consider reducing position size or hedging with protective puts
- Key support level at ${support:,.2f} — a break below could trigger further decline
- Wait for stabilization before adding new positions

*Disclaimer: This is not financial advice. Always do your own research before making investment decisions.*""",

    "neutral": """### 📊 Market Analysis: {ticker} ({company})

- **Current Price**: ${price:,.2f}
- **24h Change**: {change:+.1f}%
- **Trend**: Consolidating in range

### 📰 News & Sentiment
- **Overall Sentiment**: Neutral (based on {article_count} articles)
- {headline_1}
- {headline_2}

### 💡 Recommendation
- **Signal**: Hold / Wait
- Mixed signals suggest a wait-and-see approach
- Monitor the ${support:,.2f} - ${target:,.2f} range for a breakout direction
- Consider small positions on confirmed breakout with volume confirmation

*Disclaimer: This is not financial advice. Always do your own research before making investment decisions.*""",
}

QUERY_TEMPLATES = [
    "What do you think about {ticker}?",
    "Should I buy {company} stock?",
    "Analyze {ticker} for me",
    "What's the outlook for {company}?",
    "Is {ticker} a good investment right now?",
    "Give me your analysis on {company} ({ticker})",
    "What are the market conditions for {ticker}?",
    "How is {company} performing in the current market?",
    "Can you provide a market analysis for {ticker}?",
    "What's your recommendation on {company}?",
]


def generate_price_data(ticker: str, scenario: dict) -> dict:
    """Generate realistic price data for a ticker."""
    base_prices = {
        "BTC": 45000, "ETH": 2500, "NVDA": 800, "AAPL": 185,
        "TSLA": 250, "MSFT": 415, "GOOGL": 155, "AMZN": 185,
        "META": 500, "SOL": 120, "SPY": 510,
    }

    base = base_prices.get(ticker, 100)
    noise = random.uniform(-0.05, 0.05)
    price = base * (1 + noise)

    if scenario["price_direction"] == "up":
        change = random.uniform(1.5, 8.0)
    elif scenario["price_direction"] == "down":
        change = random.uniform(1.5, 8.0)
    else:
        change = random.uniform(-0.5, 0.5)

    return {
        "price": price,
        "change": change,
        "support": price * 0.95,
        "target": price * 1.1,
        "stop_loss": price * 0.92,
    }


def generate_sample(ticker: str, company: str, scenario: dict) -> dict:
    """Generate a single training sample."""
    price_data = generate_price_data(ticker, scenario)
    article_count = random.randint(3, 12)
    pct = random.randint(5, 25)

    # Generate headlines
    headlines = random.sample(scenario["news_templates"], min(2, len(scenario["news_templates"])))
    headline_1 = headlines[0].format(ticker=ticker, company=company, pct=pct)
    headline_2 = headlines[1].format(ticker=ticker, company=company, pct=pct) if len(headlines) > 1 else ""

    # Build the query
    query = random.choice(QUERY_TEMPLATES).format(ticker=ticker, company=company)

    # Build context (simulates what the advisor sees)
    context = f"""Real-time Market Data:
- {ticker} Current Price: ${price_data['price']:,.2f}
- 24h Change: {'+' if scenario['price_direction'] != 'down' else '-'}{price_data['change']:.1f}%

Sentiment Analysis:
- Overall: {scenario['sentiment']}
- Article Count: {article_count}
- Headlines: {headline_1}; {headline_2}

Latest Market News:
- {headline_1}
- {headline_2}"""

    # Build the expected output
    template = ANALYSIS_TEMPLATES[scenario["condition"]]
    output = template.format(
        ticker=ticker,
        company=company,
        price=price_data["price"],
        change=price_data["change"],
        article_count=article_count,
        headline_1=headline_1,
        headline_2=headline_2,
        support=price_data["support"],
        target=price_data["target"],
        stop_loss=price_data["stop_loss"],
    )

    return {
        "instruction": query,
        "input": context,
        "output": output,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate QLoRA training data for AutoTraderX")
    parser.add_argument("--output", type=str, default="training_data.jsonl", help="Output JSONL file path")
    parser.add_argument("--num-samples", type=int, default=500, help="Number of training samples to generate")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    args = parser.parse_args()

    random.seed(args.seed)
    output_path = Path(args.output)

    samples = []
    for i in range(args.num_samples):
        ticker, company = random.choice(TICKERS)
        scenario = random.choice(MARKET_SCENARIOS)
        sample = generate_sample(ticker, company, scenario)
        samples.append(sample)

    # Write to JSONL
    with open(output_path, "w") as f:
        for sample in samples:
            f.write(json.dumps(sample) + "\n")

    print(f"✅ Generated {len(samples)} training samples → {output_path}")
    print(f"   Tickers covered: {len(TICKERS)}")
    print(f"   Scenarios: bullish, bearish, neutral")

    # Print a sample
    print("\n📋 Sample entry:")
    print(json.dumps(samples[0], indent=2)[:500] + "...")


if __name__ == "__main__":
    main()
