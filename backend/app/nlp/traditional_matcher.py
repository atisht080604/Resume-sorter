from typing import List, Set, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class TraditionalNLPMatcher:
    """
    Baseline traditional NLP matching models:
    1. Keyword / Jaccard Set Overlap
    2. TF-IDF Vectorization with Cosine Similarity
    """

    @staticmethod
    def calculate_jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
        """
        Calculates Jaccard similarity coefficient:
        J(A, B) = |A ∩ B| / |A ∪ B|
        Returns normalized score between 0.0 and 100.0.
        """
        if not set_a and not set_b:
            return 0.0
        
        # Lowercase for robust matching
        a_lower = {item.strip().lower() for item in set_a if item.strip()}
        b_lower = {item.strip().lower() for item in set_b if item.strip()}

        if not a_lower or not b_lower:
            return 0.0

        intersection = a_lower.intersection(b_lower)
        union = a_lower.union(b_lower)

        if not union:
            return 0.0

        score = (len(intersection) / len(union)) * 100.0
        return round(score, 2)

    @staticmethod
    def calculate_keyword_overlap(job_skills: List[str], candidate_skills: List[str]) -> float:
        """
        Calculates percentage of job skills present in candidate skills.
        """
        if not job_skills:
            return 100.0  # If job specifies no skills, 100% overlap
        if not candidate_skills:
            return 0.0

        job_set = {s.strip().lower() for s in job_skills if s.strip()}
        cand_set = {s.strip().lower() for s in candidate_skills if s.strip()}

        matched = job_set.intersection(cand_set)
        score = (len(matched) / len(job_set)) * 100.0
        return round(score, 2)

    @staticmethod
    def calculate_tfidf_similarity(text_job: str, text_resume: str) -> float:
        """
        Vectorizes job description and resume using TF-IDF and computes cosine similarity.
        Returns normalized score between 0.0 and 100.0.
        """
        if not text_job or not text_resume:
            return 0.0

        try:
            vectorizer = TfidfVectorizer(
                stop_words='english',
                ngram_range=(1, 2),
                max_features=5000
            )
            tfidf_matrix = vectorizer.fit_transform([text_job, text_resume])
            cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            score = max(0.0, min(100.0, float(cos_sim) * 100.0))
            return round(score, 2)
        except Exception:
            return 0.0
