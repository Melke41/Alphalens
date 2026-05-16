import os
import json
from dotenv import load_dotenv
from pathlib import Path

# Load .env
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print(f"Groq API Key loaded: {bool(GROQ_API_KEY)}")

from groq import Groq
client = Groq(api_key=GROQ_API_KEY)

def analyze_query(query: str) -> dict:
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are AlphaLens, an institutional-grade 
                    quantitative research AI used by hedge funds, asset managers, 
                    and central banks. Analyze the research question and return 
                    ONLY a valid JSON object with no extra text, no markdown, 
                    no backticks, no explanation:
                    {
                      "asset": "main ticker symbol like BTC-USD, AAPL, SPY",
                      "compare_asset": "secondary ticker or null",
                      "timeframe": "period like 1y, 2y, 5y",
                      "analysis_type": "one of: correlation, backtest, risk, macro, sentiment, factor",
                      "indicators": ["list", "of", "indicators"],
                      "hypothesis": "the core hypothesis being tested",
                      "narrative": "2-3 sentence expert quant analyst commentary"
                    }"""
                },
                {
                    "role": "user",
                    "content": f"Research question: {query}"
                }
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        raw = response.choices[0].message.content.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()
        result = json.loads(raw)
        result["raw_query"] = query
        return result
        
    except Exception as e:
        return {
            "asset": "SPY",
            "compare_asset": None,
            "timeframe": "1y",
            "analysis_type": "general",
            "indicators": [],
            "hypothesis": f"Could not parse query: {str(e)}",
            "narrative": "Using default analysis.",
            "raw_query": query
        }

def generate_research_narrative(query: str, data: dict) -> str:
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """You are a senior quantitative researcher 
                    at a top hedge fund. Write a professional research narrative 
                    of 4-5 sentences based on the data provided. Include: 
                    what the data shows, statistical significance, risk 
                    considerations, and a final verdict. Sound exactly like 
                    a Goldman Sachs research note. Be specific with numbers."""
                },
                {
                    "role": "user",
                    "content": f"Research question: {query}\n\nData: {json.dumps(data)}"
                }
            ],
            temperature=0.3,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        return f"Narrative generation failed: {str(e)}"
