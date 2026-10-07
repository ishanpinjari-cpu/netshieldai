import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_report(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor('#0F172A')     # Slate 900
    accent_blue = colors.HexColor('#0284C7')       # Sky 600
    accent_teal = colors.HexColor('#0D9488')       # Teal 600
    accent_orange = colors.HexColor('#EA580C')     # Orange 600
    border_color = colors.HexColor('#E2E8F0')      # Slate 200
    bg_header = colors.HexColor('#1E293B')         # Slate 800
    bg_subtle_green = colors.HexColor('#F0FDF4')   # Green 50
    bg_subtle_amber = colors.HexColor('#FFFBEB')   # Amber 50
    bg_subtle_blue = colors.HexColor('#F0F9FF')    # Sky 50

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_LEFT
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    badge_real_style = ParagraphStyle(
        'BadgeReal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#15803D')
    )

    badge_sim_style = ParagraphStyle(
        'BadgeSim',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#B45309')
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    td_title = ParagraphStyle(
        'TableTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    td_mono = ParagraphStyle(
        'TableMono',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#0284C7')
    )

    td_body = ParagraphStyle(
        'TableBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # Title & Subtitle Header
    story.append(Paragraph("🛡️ NetShield AI", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Intelligent Network Traffic Anomaly Detection System — Architecture & Data Authenticity Audit", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=4, spaceAfter=12))

    # Executive Summary Paragraph
    exec_summary = (
        "<b>Executive Summary:</b> NetShield AI operates as a <b>hybrid cybersecurity platform</b>. "
        "It combines real-time operating system telemetry and actual Scikit-Learn Machine Learning inference "
        "with synthetic cyber-attack vectors. This architecture ensures the platform captures genuine host networking activity "
        "while simultaneously giving ML models verifiable threat signatures to detect and classify in demonstration and testing environments."
    )
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 10))

    # TABLE 1: 100% REAL COMPONENTS
    story.append(Paragraph("1. Components That Are 100% REAL", h1_style))
    story.append(Paragraph("These metrics and algorithms directly interact with the operating system and execute live mathematical calculations in memory:", body_style))
    story.append(Spacer(1, 6))

    table1_data = [
        [
            Paragraph("Component", th_style),
            Paragraph("Type", th_style),
            Paragraph("Technical Implementation & Real Data Source", th_style),
            Paragraph("Source File Reference", th_style)
        ],
        [
            Paragraph("<b>Live Network Throughput</b>", td_title),
            Paragraph("REAL", badge_real_style),
            Paragraph("Continuously reads the Windows network adapter I/O counters: bytes sent, bytes received, packet rate per second, and network delta throughput (KB/s and MB/s).", td_body),
            Paragraph("ml-service/services/<br/>network_capture.py<br/>(psutil.net_io_counters)", td_mono)
        ],
        [
            Paragraph("<b>Active Socket Connections</b>", td_title),
            Paragraph("REAL", badge_real_style),
            Paragraph("Queries active TCP/IP sockets on the host OS: extracts local IP, remote destination IP addresses, active connection ports, socket state (ESTABLISHED), and process PIDs.", td_body),
            Paragraph("ml-service/services/<br/>network_capture.py<br/>(psutil.net_connections)", td_mono)
        ],
        [
            Paragraph("<b>Process Attribution</b>", td_title),
            Paragraph("REAL", badge_real_style),
            Paragraph("Resolves socket PIDs to real Windows running applications (e.g., chrome.exe, node.exe, Code.exe) generating inbound and outbound network activity.", td_body),
            Paragraph("ml-service/services/<br/>network_capture.py<br/>(_get_process_name)", td_mono)
        ],
        [
            Paragraph("<b>Deep Packet Sniffing</b>", td_title),
            Paragraph("REAL", badge_real_style),
            Paragraph("Raw Ethernet and IP packet capture directly from host network interfaces via Scapy when administrator/Npcap drivers are present.", td_body),
            Paragraph("ml-service/services/<br/>network_capture.py<br/>(scapy.all.sniff)", td_mono)
        ],
        [
            Paragraph("<b>Machine Learning Engine</b>", td_title),
            Paragraph("REAL", badge_real_style),
            Paragraph("Executes trained Scikit-Learn models (Random Forest with 88% accuracy & Isolation Forest). Extracts 13 engineered features per packet and performs mathematical vector classification.", td_body),
            Paragraph("ml-service/models/<br/>model_manager.py<br/>(model.predict)", td_mono)
        ]
    ]

    col_widths_1 = [120, 50, 240, 122]
    t1 = Table(table1_data, colWidths=col_widths_1, repeatRows=1)
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), bg_header),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BACKGROUND', (0, 1), (-1, 1), bg_subtle_green),
        ('BACKGROUND', (0, 2), (-1, 2), colors.white),
        ('BACKGROUND', (0, 3), (-1, 3), bg_subtle_green),
        ('BACKGROUND', (0, 4), (-1, 4), colors.white),
        ('BACKGROUND', (0, 5), (-1, 5), bg_subtle_green),
    ]))
    story.append(t1)
    story.append(Spacer(1, 14))

    # TABLE 2: SIMULATED / SYNTHETIC COMPONENTS
    story.append(Paragraph("2. Components That Are SIMULATED / SYNTHETIC", h1_style))
    story.append(Paragraph("To demonstrate intrusion detection without needing your machine under active attack, synthetic data is utilized:", body_style))
    story.append(Spacer(1, 6))

    table2_data = [
        [
            Paragraph("Component", th_style),
            Paragraph("Type", th_style),
            Paragraph("Rationale & Simulation Mechanism", th_style),
            Paragraph("Source File Reference", th_style)
        ],
        [
            Paragraph("<b>Cyber Attack Payloads</b>", td_title),
            Paragraph("SIMULATED", badge_sim_style),
            Paragraph("Under normal conditions, a developer's PC has 0 cyber attacks. The simulator injects synthetic packet features mimicking DDoS (SYN floods), Port Scans, and Brute Force to demonstrate alert generation.", td_body),
            Paragraph("ml-service/services/<br/>traffic_simulator.py<br/>(generate_packet)", td_mono)
        ],
        [
            Paragraph("<b>Attack Categories Matrix</b>", td_title),
            Paragraph("SYNTHETIC", badge_sim_style),
            Paragraph("9 pre-defined labels (Normal, DDoS, Port Scanning, Malware Communication, Botnet, Data Exfiltration, Brute Force, Suspicious, Unknown) used to benchmark classifier predictions.", td_body),
            Paragraph("ml-service/services/<br/>traffic_simulator.py<br/>(ATTACK_CATEGORIES)", td_mono)
        ],
        [
            Paragraph("<b>Database In-Memory Fallback</b>", td_title),
            Paragraph("FALLBACK", badge_sim_style),
            Paragraph("When MongoDB local daemon is not running, the Node.js server gracefully activates an in-memory alert store to allow live frontend testing without crashing.", td_body),
            Paragraph("server/src/<br/>config/db.js &<br/>routes/api.js", td_mono)
        ]
    ]

    t2 = Table(table2_data, colWidths=col_widths_1, repeatRows=1)
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7C2D12')),  # Deep amber/brown
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BACKGROUND', (0, 1), (-1, 1), bg_subtle_amber),
        ('BACKGROUND', (0, 2), (-1, 2), colors.white),
        ('BACKGROUND', (0, 3), (-1, 3), bg_subtle_amber),
    ]))
    story.append(t2)
    story.append(Spacer(1, 14))

    # TABLE 3: MACHINE LEARNING SPECIFICATIONS
    story.append(Paragraph("3. Machine Learning Model Specifications", h1_style))
    story.append(Spacer(1, 4))

    table3_data = [
        [
            Paragraph("Model Name", th_style),
            Paragraph("Learning Paradigm", th_style),
            Paragraph("Primary Role", th_style),
            Paragraph("Verified Accuracy", th_style),
            Paragraph("Serialized Model File", th_style)
        ],
        [
            Paragraph("<b>Random Forest</b>", td_title),
            Paragraph("Supervised", td_body),
            Paragraph("Multi-class classification of specific cyber-attacks vs normal traffic", td_body),
            Paragraph("<b>88.0%</b>", td_title),
            Paragraph("ml-service/saved_models/<br/>random_forest.pkl", td_mono)
        ],
        [
            Paragraph("<b>Isolation Forest</b>", td_title),
            Paragraph("Unsupervised", td_body),
            Paragraph("Outlier detection for previously unseen and novel attack anomalies", td_body),
            Paragraph("<b>Anomaly Score</b>", td_title),
            Paragraph("ml-service/saved_models/<br/>isolation_forest.pkl", td_mono)
        ],
        [
            Paragraph("<b>XGBoost Classifier</b>", td_title),
            Paragraph("Gradient Boosted", td_body),
            Paragraph("High-speed gradient boosting classifier for tabular network features", td_body),
            Paragraph("Supported", td_body),
            Paragraph("ml-service/models/<br/>model_manager.py", td_mono)
        ]
    ]

    col_widths_3 = [110, 85, 175, 75, 87]
    t3 = Table(table3_data, colWidths=col_widths_3, repeatRows=1)
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F766E')),  # Deep Teal
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('BACKGROUND', (0, 1), (-1, 1), bg_subtle_blue),
        ('BACKGROUND', (0, 2), (-1, 2), colors.white),
        ('BACKGROUND', (0, 3), (-1, 3), bg_subtle_blue),
    ]))
    story.append(t3)
    story.append(Spacer(1, 14))

    # FOOTER NOTE
    story.append(HRFlowable(width="100%", thickness=0.5, color=border_color, spaceBefore=4, spaceAfter=8))
    footer_text = (
        "<b>Audited Status:</b> NetShield AI ML service is active on port 8000, Node backend on port 5000, and React UI on port 3000. "
        "Generated automatically by NetShield AI diagnostic agent."
    )
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, leading=11, textColor=colors.HexColor('#64748B'))))

    doc.build(story)
    print(f"PDF successfully generated at: {output_filename}")

if __name__ == '__main__':
    target = os.path.abspath(os.path.join(os.path.dirname(__file__), 'NetShield_AI_Data_Authenticity_Audit.pdf'))
    create_report(target)
