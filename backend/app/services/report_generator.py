import io
import csv
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportGenerator:
    """
    Generates downloadable CSV and professional PDF reports for candidate screening sessions.
    """

    @staticmethod
    def generate_csv(session_data: Dict[str, Any], results_data: List[Dict[str, Any]]) -> io.StringIO:
        """Generates CSV report formatted for recruiter data export."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header Metadata
        writer.writerow(["AI-Powered Resume Screening Report"])
        writer.writerow(["Job Title", session_data.get('job_title', 'N/A')])
        writer.writerow(["Department", session_data.get('department', 'N/A')])
        writer.writerow(["Screening Session ID", session_data.get('session_uid', 'N/A')])
        writer.writerow(["Screening Date", session_data.get('created_at', datetime.utcnow().isoformat())])
        writer.writerow(["Total Candidates", session_data.get('total_resumes', len(results_data))])
        writer.writerow(["Average Match Score", f"{session_data.get('average_score', 0.0)}%"])
        writer.writerow([])  # Blank row

        # Table Header
        writer.writerow([
            "Rank",
            "Candidate ID",
            "Candidate Name",
            "Resume Filename",
            "Final Composite Score (%)",
            "Match Category",
            "Semantic Similarity (%)",
            "Required Skills Score (%)",
            "Preferred Skills Score (%)",
            "Experience Score (%)",
            "Education Score (%)",
            "Certification Score (%)",
            "Matched Required Skills",
            "Missing Required Skills",
            "Partial/Inferred Skills",
            "Traditional Jaccard Score (%)",
            "TF-IDF Cosine Score (%)"
        ])

        for r in results_data:
            scores = r.get('scores', {})
            skills = r.get('skills_breakdown', {})
            partial_str = "; ".join(f"{p.get('job_skill')} ≈ {p.get('candidate_skill')} ({p.get('similarity')})" for p in skills.get('partial_matches', []))

            writer.writerow([
                r.get('rank', 'N/A'),
                r.get('candidate_uid', 'N/A'),
                r.get('candidate_name', 'Candidate'),
                r.get('filename', ''),
                r.get('composite_score', 0.0),
                r.get('match_category', 'Low Match'),
                scores.get('semantic_similarity', 0.0),
                scores.get('required_skills', 0.0),
                scores.get('preferred_skills', 0.0),
                scores.get('experience', 0.0),
                scores.get('education', 0.0),
                scores.get('certification', 0.0),
                "; ".join(skills.get('matched_required', [])),
                "; ".join(skills.get('missing_required', [])),
                partial_str,
                scores.get('keyword_jaccard', 0.0),
                scores.get('tfidf_cosine', 0.0),
            ])

        output.seek(0)
        return output

    @staticmethod
    def generate_pdf(session_data: Dict[str, Any], results_data: List[Dict[str, Any]]) -> io.BytesIO:
        """
        Generates a clean, professional landscape PDF report with candidate rankings and score breakdowns.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )

        elements = []
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#1E293B'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748B'),
            spaceAfter=12
        )
        header_cell_style = ParagraphStyle(
            'HeaderCell',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            fontName='Helvetica-Bold',
            textColor=colors.white
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#334155')
        )
        bold_cell_style = ParagraphStyle(
            'BoldCellText',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#0F172A')
        )

        # Title and Session Details
        job_title = session_data.get('job_title', 'Job Screening Report')
        date_str = session_data.get('created_at', datetime.utcnow().strftime('%Y-%m-%d %H:%M'))
        if 'T' in str(date_str):
            date_str = str(date_str).replace('T', ' ')[:16]

        elements.append(Paragraph(f"Candidate Screening Report: {job_title}", title_style))
        elements.append(Paragraph(
            f"<b>Session ID:</b> {session_data.get('session_uid', 'N/A')} &nbsp;|&nbsp; "
            f"<b>Department:</b> {session_data.get('department', 'Engineering')} &nbsp;|&nbsp; "
            f"<b>Date:</b> {date_str} &nbsp;|&nbsp; "
            f"<b>Candidates Screened:</b> {session_data.get('total_resumes', len(results_data))} &nbsp;|&nbsp; "
            f"<b>Avg Score:</b> {session_data.get('average_score', 0.0)}%",
            subtitle_style
        ))
        elements.append(Spacer(1, 10))

        # Build Candidate Ranking Table
        table_data = [[
            Paragraph("Rank", header_cell_style),
            Paragraph("Candidate ID", header_cell_style),
            Paragraph("Candidate Name", header_cell_style),
            Paragraph("Score (%)", header_cell_style),
            Paragraph("Category", header_cell_style),
            Paragraph("Semantic (40%)", header_cell_style),
            Paragraph("Req Skills (25%)", header_cell_style),
            Paragraph("Pref (15%)", header_cell_style),
            Paragraph("Exp (10%)", header_cell_style),
            Paragraph("Matched Skills", header_cell_style),
            Paragraph("Missing Req Skills", header_cell_style)
        ]]

        for r in results_data:
            cat = r.get('match_category', 'Low Match')
            score = r.get('composite_score', 0.0)
            scores = r.get('scores', {})
            skills = r.get('skills_breakdown', {})
            matched_str = ", ".join(skills.get('matched_required', [])) or "None"
            missing_str = ", ".join(skills.get('missing_required', [])) or "None"

            # Truncate strings if too long
            if len(matched_str) > 35:
                matched_str = matched_str[:32] + "..."
            if len(missing_str) > 35:
                missing_str = missing_str[:32] + "..."

            table_data.append([
                Paragraph(str(r.get('rank', '-')), bold_cell_style),
                Paragraph(str(r.get('candidate_uid', 'N/A')), cell_style),
                Paragraph(str(r.get('candidate_name', 'Candidate')), cell_style),
                Paragraph(f"<b>{score}%</b>", bold_cell_style),
                Paragraph(cat, cell_style),
                Paragraph(f"{scores.get('semantic_similarity', 0.0)}%", cell_style),
                Paragraph(f"{scores.get('required_skills', 0.0)}%", cell_style),
                Paragraph(f"{scores.get('preferred_skills', 0.0)}%", cell_style),
                Paragraph(f"{scores.get('experience', 0.0)}%", cell_style),
                Paragraph(matched_str, cell_style),
                Paragraph(missing_str, cell_style)
            ])

        col_widths = [35, 75, 80, 50, 65, 65, 65, 55, 50, 100, 100]
        summary_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
        ]))

        elements.append(summary_table)
        elements.append(Spacer(1, 15))

        elements.append(Paragraph(
            "<i>Note: Match categories are decision-support indicators. Scoring is calculated according to the formula: "
            "0.40 × Semantic + 0.25 × Required Skills + 0.15 × Preferred Skills + 0.10 × Experience + 0.05 × Education + 0.05 × Certification.</i>",
            subtitle_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer
