import threading
import hashlib
from typing import List, Union
import numpy as np

class EmbeddingService:
    """
    Singleton service managing Sentence-Transformers model loading,
    embedding generation with SHA-256 caching, and cosine similarity calculation.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(EmbeddingService, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_name: str = 'sentence-transformers/all-MiniLM-L6-v2'):
        if self._initialized:
            return
        self.model_name = model_name
        self._model = None
        self._cache = {}
        self._initialized = True

    def get_model(self):
        """Lazy-loads the SentenceTransformer model on first invocation."""
        if self._model is None:
            with self._lock:
                if self._model is None:
                    try:
                        from sentence_transformers import SentenceTransformer
                        print(f"[EmbeddingService] Loading model '{self.model_name}'...")
                        self._model = SentenceTransformer(self.model_name)
                        print(f"[EmbeddingService] Model '{self.model_name}' loaded successfully.")
                    except Exception as e:
                        print(f"[EmbeddingService] Warning: Failed to load '{self.model_name}': {e}")
                        raise RuntimeError(f"Could not load SentenceTransformer '{self.model_name}': {str(e)}")
        return self._model

    def encode(self, text: str) -> np.ndarray:
        """
        Generates embedding for input text with SHA-256 caching.
        """
        if not text:
            # Return zero vector of 384 dimensions for all-MiniLM-L6-v2
            return np.zeros(384, dtype=np.float32)

        cache_key = hashlib.sha256(text.encode('utf-8')).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]

        model = self.get_model()
        # Truncate extremely long texts safely for the transformer context window
        embedding = model.encode(text, convert_to_numpy=True, normalize_embeddings=True)
        self._cache[cache_key] = embedding
        return embedding

    def calculate_similarity(self, text_a: str, text_b: str) -> float:
        """
        Calculates cosine similarity between two texts.
        Since embeddings are normalized, dot product equals cosine similarity.
        Returns value between 0.0 and 1.0.
        """
        emb_a = self.encode(text_a)
        emb_b = self.encode(text_b)
        
        norm_a = np.linalg.norm(emb_a)
        norm_b = np.linalg.norm(emb_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        cos_sim = float(np.dot(emb_a, emb_b) / (norm_a * norm_b))
        # Clip to [0.0, 1.0] range
        return max(0.0, min(1.0, cos_sim))

    def calculate_normalized_score(self, text_a: str, text_b: str) -> float:
        """
        Normalizes semantic similarity to a standard 0 - 100 percentage scale.
        """
        sim = self.calculate_similarity(text_a, text_b)
        return round(sim * 100.0, 2)
