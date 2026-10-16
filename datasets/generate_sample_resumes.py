import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import docx

def create_pdf_resume(filepath, name, title, email, phone, experience_years, education, skills, summary, exp_bullets):
    doc = SimpleDocTemplate(filepath, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle('Name', parent=styles['Heading1'], fontSize=20, leading=24, textColor=colors.HexColor('#0F172A'))
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#475569'))
    h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, leading=16, textColor=colors.HexColor('#1E3A8A'), spaceBefore=10, spaceAfter=4)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#1E293B'))

    elements = [
        Paragraph(name, title_style),
        Paragraph(f"{title} | {email} | {phone}", sub_style),
        Spacer(1, 10),
        Paragraph("Professional Summary", h2_style),
        Paragraph(summary, body_style),
        Spacer(1, 8),
        Paragraph("Technical Skills", h2_style),
        Paragraph(f"<b>Core Technologies:</b> {', '.join(skills)}", body_style),
        Spacer(1, 8),
        Paragraph("Work Experience", h2_style),
        Paragraph(f"<b>Senior Developer</b> (2020 - 2026, {experience_years} years of experience)", body_style)
    ]
    for b in exp_bullets:
        elements.append(Paragraph(f"• {b}", body_style))
    
    elements.extend([
        Spacer(1, 8),
        Paragraph("Education", h2_style),
        Paragraph(f"• {education}", body_style)
    ])
    
    doc.build(elements)

def create_docx_resume(filepath, name, title, email, phone, experience_years, education, skills, summary, exp_bullets):
    doc = docx.Document()
    doc.add_heading(name, level=0)
    doc.add_paragraph(f"{title} | {email} | {phone}")
    
    doc.add_heading('Professional Summary', level=1)
    doc.add_paragraph(summary)
    
    doc.add_heading('Technical Skills', level=1)
    doc.add_paragraph(f"Core Skills: {', '.join(skills)}")
    
    doc.add_heading('Work Experience', level=1)
    doc.add_paragraph(f"Software Engineer ({experience_years} years of experience)")
    for b in exp_bullets:
        doc.add_paragraph(b, style='List Bullet')
        
    doc.add_heading('Education', level=1)
    doc.add_paragraph(education)
    
    doc.save(filepath)

def generate_all():
    target_dir = os.path.join(os.path.dirname(__file__), 'sample_resumes')
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. Arjun Sharma - Senior Python Developer (PDF)
    create_pdf_resume(
        os.path.join(target_dir, 'arjun_sharma_senior_python_dev.pdf'),
        "Arjun Sharma",
        "Senior Python Backend Engineer",
        "arjun.sharma@example.com",
        "(555) 234-5678",
        5.0,
        "Bachelor of Technology in Computer Science, 2021",
        ["Python", "Flask", "FastAPI", "PostgreSQL", "Docker", "Redis", "AWS", "Git", "REST APIs", "CI/CD"],
        "Accomplished Senior Python Engineer with 5+ years of experience designing scalable microservices, relational databases with PostgreSQL, and cloud deployments on AWS using Docker.",
        [
            "Architected REST APIs in FastAPI and Flask handling 10M+ daily requests.",
            "Integrated Redis for high-speed caching and query acceleration by 45%.",
            "Deployed microservices on AWS with Docker and automated GitHub Actions CI/CD."
        ]
    )

    # 2. Priya Nair - Full Stack Developer (DOCX)
    create_docx_resume(
        os.path.join(target_dir, 'priya_nair_fullstack_dev.docx'),
        "Priya Nair",
        "Full Stack Developer",
        "priya.nair@example.com",
        "(555) 345-6789",
        3.0,
        "Master of Computer Applications (MCA), 2023",
        ["Python", "Django", "MySQL", "JavaScript", "React", "HTML", "CSS", "Git", "Docker"],
        "Versatile Full Stack Developer with 3 years experience building end-to-end web applications using Python, Django, React, and MySQL databases.",
        [
            "Built responsive full-stack features using React and Django REST Framework.",
            "Created database schemas and optimized complex SQL queries in MySQL.",
            "Collaborated within Agile sprint teams delivering features on schedule."
        ]
    )

    # 3. Rohan Gupta - Frontend Engineer (PDF - Low backend match)
    create_pdf_resume(
        os.path.join(target_dir, 'rohan_gupta_frontend_engineer.pdf'),
        "Rohan Gupta",
        "Senior Frontend Specialist",
        "rohan.gupta@example.com",
        "(555) 456-7890",
        4.0,
        "Bachelor of Science in Information Technology, 2022",
        ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Next.js", "Git", "Jest"],
        "Creative Frontend Engineer with 4 years experience specializing in high-performance web applications, modern UI/UX design, React, and TypeScript.",
        [
            "Developed modern user interfaces using React, Next.js, and Tailwind CSS.",
            "Implemented reusable component design systems and state management.",
            "Achieved 98+ Google Lighthouse accessibility and performance ratings."
        ]
    )

    # 4. Ananya Roy - Lead Backend Architect (DOCX - High match)
    create_docx_resume(
        os.path.join(target_dir, 'ananya_roy_lead_architect.docx'),
        "Ananya Roy",
        "Lead Backend Architect",
        "ananya.roy@example.com",
        "(555) 567-8901",
        7.0,
        "Master of Technology in Computer Engineering, 2019",
        ["Python", "Flask", "FastAPI", "PostgreSQL", "Docker", "Redis", "Kubernetes", "AWS", "Microservices", "System Design", "Linux"],
        "Strategic Lead Architect with 7+ years of experience leading distributed systems engineering. Expert in Python, microservices architecture, PostgreSQL database sharding, and Kubernetes.",
        [
            "Led backend architecture across 12 distributed services in Python and FastAPI.",
            "Engineered caching tier with Redis and message queue streaming with Kafka.",
            "Mentored engineering teams and established code quality standards."
        ]
    )

    # 5. Vikas Patel - Junior Developer (PDF)
    create_pdf_resume(
        os.path.join(target_dir, 'vikas_patel_junior_dev.pdf'),
        "Vikas Patel",
        "Junior Software Developer",
        "vikas.patel@example.com",
        "(555) 678-9012",
        1.0,
        "Bachelor of Computer Applications (BCA), 2025",
        ["Python", "Flask", "SQLite", "Git", "HTML", "CSS"],
        "Enthusiastic Junior Developer with 1 year experience building web tools using Python, Flask, and SQLite. Eager to grow as a backend engineer.",
        [
            "Developed internal CRUD portals in Flask with SQLite database.",
            "Wrote unit tests and documented REST endpoints.",
            "Participated in code reviews and version control workflows with Git."
        ]
    )

    # 6. Scanned/Empty PDF document (for testing validation error handling)
    doc_empty = SimpleDocTemplate(os.path.join(target_dir, 'scanned_image_empty_resume.pdf'), pagesize=letter)
    doc_empty.build([Paragraph("Page 1", getSampleStyleSheet()['Normal'])])

    print(f"Generated sample resumes in {target_dir}")

if __name__ == '__main__':
    generate_all()
