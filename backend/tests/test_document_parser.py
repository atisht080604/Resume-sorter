import pytest
from app.services.document_parser import DocumentParser

def test_experience_estimation():
    parser = DocumentParser()
    text = "Software Engineer with 4.5 years of experience in backend development."
    years = parser._estimate_experience_years(text)
    assert years == 4.5

def test_date_range_experience():
    parser = DocumentParser()
    text = "Experience:\nAcme Corp: 2019 - 2023\nSenior Developer"
    years = parser._estimate_experience_years(text)
    assert years == 4.0

def test_degree_detection():
    parser = DocumentParser()
    text = "Education:\nMaster of Computer Applications (MCA), 2022\nB.Tech in Computer Science"
    degrees = parser._extract_education(text)
    assert any('Mca' in d or 'Master' in d for d in degrees)
    assert any('B.Tech' in d or 'Btech' in d or 'Technology' in d for d in degrees)

def test_sufficiency_check():
    parser = DocumentParser()
    # Empty or scanned PDF with no text layer
    insufficient_text = "Page 1"
    is_suff, msg = parser.validate_content_sufficiency(insufficient_text)
    assert is_suff is False
    assert "Insufficient text" in msg
