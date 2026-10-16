from typing import Dict, Any, List
from ..services.embedding_service import EmbeddingService

class SemanticMatcher:
    """
    Semantic matching engine utilizing Sentence-BERT (all-MiniLM-L6-v2)
    to calculate contextual semantic similarity between job descriptions and resumes.
    """

    def __init__(self, embedding_service: EmbeddingService = None):
        self.embedding_service = embedding_service or EmbeddingService()

    def calculate_semantic_similarity(self, job_text: str, resume_text: str) -> float:
        """
        Calculates Sentence-BERT semantic similarity normalized to 0-100 scale.
        """
        if not job_text or not resume_text:
            return 0.0

        return self.embedding_service.calculate_normalized_score(job_text, resume_text)

    def calculate_skill_semantic_similarity(self, skill_a: str, skill_b: str) -> float:
        """
        Calculates similarity between two individual skill phrases (0.0 to 1.0).
        """
        return self.embedding_service.calculate_similarity(skill_a, skill_b)
