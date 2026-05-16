import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
import io
import base64

def generate_research_report(data: dict) -> str:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    BLUE = HexColor("#3b82f6")
    DARK = HexColor("#0a0a0a")
    GRAY = HexColor("#6b7280")
    LIGHT_GRAY = HexColor("#f3f4f6")
    RED = HexColor("#ef4444")
    GREEN = HexColor("#22c55e")

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "Title", fontSize=24, fontName="Helvetica-Bold",
        textColor=DARK, spaceAfter=4, alignment=TA_LEFT
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", fontSize=11, fontName="Helvetica",
        textColor=GRAY, spaceAfter=2, alignment=TA_LEFT
    )
    header_style = ParagraphStyle(
        "Header", fontSize=13, fontName="Helvetica-Bold",
        textColor=BLUE, spaceBefore=16, spaceAfter=6
    )
    body_style = ParagraphStyle(
        "Body", fontSize=10, fontName="Helvetica",
        textColor=DARK, spaceAfter=6, leading=16
    )
    metric_label_style = ParagraphStyle(
        "MetricLabel", fontSize=8, fontName="Helvetica",
        textColor=GRAY, spaceAfter=2
    )
    metric_value_style = ParagraphStyle(
        "MetricValue", fontSize=14, fontName="Helvetica-Bold",
        textColor=DARK, spaceAfter=2
    )

    story = []

    # Header Banner
    header_data = [[
        Paragraph("ALPHALENS", ParagraphStyle("Logo", fontSize=18, 
            fontName="Helvetica-Bold", textColor=white)),
        Paragraph("INSTITUTIONAL RESEARCH", ParagraphStyle("Type", fontSize=9,
            fontName="Helvetica", textColor=white, alignment=TA_RIGHT)),
    ]]
    header_table = Table(header_data, colWidths=[3.5*inch, 3.5*inch])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), BLUE),
        ("PADDING", (0,0), (-1,-1), 12),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*inch))

    # Report Title
    symbol = data.get("symbol", "N/A")
    analysis_type = data.get("query_analysis", {}).get("analysis_type", "Research").upper()
    story.append(Paragraph(f"{symbol} — {analysis_type} REPORT", title_style))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M UTC')} · AlphaLens Quantitative Research",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=12))

    # Executive Summary
    story.append(Paragraph("EXECUTIVE SUMMARY", header_style))
    narrative = data.get("narrative", "No narrative available.")
    story.append(Paragraph(narrative, body_style))

    # Key Metrics Table
    story.append(Paragraph("KEY PERFORMANCE METRICS", header_style))
    market_stats = data.get("market_stats", {})
    
    metrics = [
        ["METRIC", "VALUE", "ASSESSMENT"],
        ["Latest Price", f"${market_stats.get('latest_price', 'N/A')}", "—"],
        ["Total Return", f"{market_stats.get('total_return', 'N/A')}%", 
         "POSITIVE" if float(market_stats.get('total_return', 0) or 0) > 0 else "NEGATIVE"],
        ["Annualized Volatility", f"{round(float(market_stats.get('volatility', 0) or 0) * 100, 2)}%", 
         "LOW" if float(market_stats.get('volatility', 0) or 0) < 0.2 else "HIGH"],
        ["Sharpe Ratio", f"{market_stats.get('sharpe_ratio', 'N/A')}", 
         "GOOD" if float(market_stats.get('sharpe_ratio', 0) or 0) > 1 else "BELOW AVG"],
        ["Max Drawdown", f"{round(float(market_stats.get('max_drawdown', 0) or 0) * 100, 2)}%", 
         "ACCEPTABLE" if float(market_stats.get('max_drawdown', 0) or 0) > -0.3 else "HIGH RISK"],
    ]

    metrics_table = Table(metrics, colWidths=[2.5*inch, 2*inch, 2.5*inch])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,0), 9),
        ("BACKGROUND", (0,1), (-1,-1), LIGHT_GRAY),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, LIGHT_GRAY]),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,1), (-1,-1), 9),
        ("GRID", (0,0), (-1,-1), 0.5, GRAY),
        ("PADDING", (0,0), (-1,-1), 8),
        ("ALIGN", (1,0), (-1,-1), "CENTER"),
    ]))
    story.append(metrics_table)

    # Research Analysis
    story.append(Paragraph("RESEARCH ANALYSIS", header_style))
    query_analysis = data.get("query_analysis", {})
    
    analysis_data = [
        ["PARAMETER", "VALUE"],
        ["Asset", query_analysis.get("asset", "N/A")],
        ["Analysis Type", query_analysis.get("analysis_type", "N/A").upper()],
        ["Timeframe", query_analysis.get("timeframe", "N/A").upper()],
        ["Hypothesis", query_analysis.get("hypothesis", "N/A")],
        ["Key Indicators", ", ".join(query_analysis.get("indicators", []))],
    ]
    
    analysis_table = Table(analysis_data, colWidths=[2*inch, 5*inch])
    analysis_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), DARK),
        ("TEXTCOLOR", (0,0), (-1,0), white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,0), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [white, LIGHT_GRAY]),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,1), (-1,-1), 9),
        ("GRID", (0,0), (-1,-1), 0.5, GRAY),
        ("PADDING", (0,0), (-1,-1), 8),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]))
    story.append(analysis_table)

    # Risk Disclaimer
    story.append(Spacer(1, 0.3*inch))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY))
    story.append(Spacer(1, 0.1*inch))
    disclaimer_style = ParagraphStyle(
        "Disclaimer", fontSize=7, fontName="Helvetica",
        textColor=GRAY, leading=10
    )
    story.append(Paragraph(
        "DISCLAIMER: This report is generated by AlphaLens AI for informational purposes only. "
        "It does not constitute investment advice. Past performance is not indicative of future results. "
        "All investments involve risk including possible loss of principal.",
        disclaimer_style
    ))

    doc.build(story)
    buffer.seek(0)
    pdf_base64 = base64.b64encode(buffer.read()).decode("utf-8")
    return pdf_base64
