import pytest
from app.scoring.scorer import CandidateScorer

def test_scorer_exact_formula():
    scorer = CandidateScorer()
    
    # Perfect candidate: 100 on everything
    # Expected: 0.40*100 + 0.25*100 + 0.15*100 + 0.10*100 + 0.05*100 + 0.05*100 = 100.0
    job_data = {
        'required_skills': ['Python', 'Flask'],
        'preferred_skills': ['Docker'],
        'min_experience_years': 3.0,
        'education_requirements': ["Bachelor's"],
        'certifications': ['AWS']
    }
    candidate_data = {
        'experience_years': 4.0,
        'education': ["Bachelor's in CS"],
        'certifications': ['AWS Certified']
    }
    skills_match = {
        'matched_required': ['Python', 'Flask'],
        'matched_preferred': ['Docker'],
        'partial_matches': [],
        'missing_required': [],
        'missing_preferred': []
    }

    result = scorer.score_candidate(
        semantic_similarity_score=100.0,
        job_data=job_data,
        candidate_data=candidate_data,
        skills_match_data=skills_match
    )

    assert result['composite_score'] == 100.0
    assert result['match_category'] == 'High Match'
    assert result['component_scores']['semantic_similarity'] == 100.0
    assert result['component_scores']['required_skills'] == 100.0
    assert result['component_scores']['preferred_skills'] == 100.0
    assert result['component_scores']['experience'] == 100.0

def test_scorer_category_boundaries():
    scorer = CandidateScorer()
    
    # Test High Match boundary: exactly 75%
    # Using job without complex requirements, semantic = 75, all others 75
    job_data = {
        'required_skills': ['Python'],
        'preferred_skills': [],
        'min_experience_years': 0.0,
        'education_requirements': [],
        'certifications': []
    }
    candidate_data = {'experience_years': 0.0, 'education': [], 'certifications': []}
    skills_match = {'matched_required': ['Python'], 'matched_preferred': [], 'partial_matches': [], 'missing_required': [], 'missing_preferred': []}

    res_high = scorer.score_candidate(75.0, job_data, candidate_data, skills_match)
    assert res_high['composite_score'] >= 75.0
    assert res_high['match_category'] == 'High Match'

    # Test Medium Match: composite around 65%
    job_med = {
        'required_skills': ['Python', 'SQL'],
        'preferred_skills': [],
        'min_experience_years': 0.0,
        'education_requirements': [],
        'certifications': []
    }
    # 1 of 2 required skills matched = 50%
    skills_med = {'matched_required': ['Python'], 'matched_preferred': [], 'partial_matches': [], 'missing_required': ['SQL'], 'missing_preferred': []}
    res_med = scorer.score_candidate(50.0, job_med, candidate_data, skills_med)
    assert 50.0 <= res_med['composite_score'] < 75.0
    assert res_med['match_category'] == 'Medium Match'

    # Test Low Match: composite < 50%
    skills_missing = {'matched_required': [], 'matched_preferred': [], 'partial_matches': [], 'missing_required': ['Python', 'SQL'], 'missing_preferred': []}
    res_low = scorer.score_candidate(20.0, job_med, candidate_data, skills_missing)
    assert res_low['composite_score'] < 50.0
    assert res_low['match_category'] == 'Low Match'

def test_missing_info_handling():
    scorer = CandidateScorer()
    job_data = {
        'required_skills': ['Python', 'SQL'],
        'preferred_skills': ['AWS'],
        'min_experience_years': 5.0,
        'education_requirements': ["Master's"],
        'certifications': ['PMP']
    }
    # Candidate with missing education, zero experience, missing certs
    candidate_data = {'experience_years': 0.0, 'education': [], 'certifications': []}
    skills_match = {
        'matched_required': ['Python'],
        'matched_preferred': [],
        'partial_matches': [],
        'missing_required': ['SQL'],
        'missing_preferred': ['AWS']
    }

    res = scorer.score_candidate(50.0, job_data, candidate_data, skills_match)
    # Required skills: 1/2 = 50%
    assert res['component_scores']['required_skills'] == 50.0
    # Preferred skills: 0/1 = 0%
    assert res['component_scores']['preferred_skills'] == 0.0
    # Experience: 0 / 5 = 0%
    assert res['component_scores']['experience'] == 0.0
    # Education: 0%
    assert res['component_scores']['education'] == 0.0
    # Certification: 0%
    assert res['component_scores']['certification'] == 0.0
    
    # 0.40*50 + 0.25*50 + 0 + 0 + 0 + 0 = 20.0 + 12.5 = 32.5
    assert res['composite_score'] == 32.5
    assert res['match_category'] == 'Low Match'
    assert len(res['explanation']['gaps']) > 0
