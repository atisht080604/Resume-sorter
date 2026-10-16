import pytest
from app.nlp.traditional_matcher import TraditionalNLPMatcher

def test_jaccard_similarity():
    set_a = {'Python', 'Flask', 'Docker'}
    set_b = {'Python', 'Docker', 'PostgreSQL'}
    # Intersection = 2, Union = 4 -> 50.0%
    score = TraditionalNLPMatcher.calculate_jaccard_similarity(set_a, set_b)
    assert score == 50.0

def test_tfidf_cosine_similarity():
    job_desc = "Senior Python developer with experience in microservices and cloud databases."
    resume_relevant = "Python developer with extensive experience building cloud databases and microservices."
    resume_irrelevant = "Chef and restaurant kitchen manager specializing in French pastry."

    score_rel = TraditionalNLPMatcher.calculate_tfidf_similarity(job_desc, resume_relevant)
    score_irrel = TraditionalNLPMatcher.calculate_tfidf_similarity(job_desc, resume_irrelevant)

    assert score_rel > score_irrel
    assert score_rel > 40.0
