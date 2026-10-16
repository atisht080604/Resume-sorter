import os
import json
import math
from typing import Dict, Any, List
from ..nlp.traditional_matcher import TraditionalNLPMatcher
from ..services.skill_extractor import SkillExtractor
from ..services.embedding_service import EmbeddingService

class ResearchBenchmarkEvaluator:
    """
    Reproducible evaluation pipeline comparing:
    - Keyword Overlap Matching
    - TF-IDF Cosine Similarity
    - Sentence-BERT (all-MiniLM-L6-v2) Semantic Similarity

    Evaluates ranking quality using:
    - Precision@K
    - Recall@K
    - F1@K
    - Mean Reciprocal Rank (MRR)
    - Normalized Discounted Cumulative Gain (NDCG@K)
    """

    def __init__(self, dataset_path: str = None):
        if not dataset_path:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../datasets'))
            dataset_path = os.path.join(base_dir, 'evaluation_dataset.json')
        self.dataset_path = dataset_path
        self.skill_extractor = SkillExtractor()
        self.embedding_service = EmbeddingService()

    def load_dataset(self) -> Dict[str, Any]:
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Evaluation dataset not found at {self.dataset_path}")
        with open(self.dataset_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def run_benchmark(self, k: int = 3) -> Dict[str, Any]:
        """
        Runs benchmark across all queries and returns side-by-side metrics.
        """
        dataset = self.load_dataset()
        queries = dataset.get('benchmark_queries', [])

        methods = ['keyword_overlap', 'tfidf_cosine', 'sentence_bert']
        method_metrics = {
            m: {'precision': [], 'recall': [], 'f1': [], 'mrr': [], 'ndcg': []}
            for m in methods
        }

        detailed_query_results = []

        for q in queries:
            q_id = q['query_id']
            q_title = q['title']
            q_desc = q['description']
            q_skills = q.get('required_skills', [])
            candidates = q.get('candidates', [])

            # Compute scores for each candidate per method
            scored_candidates = []
            for cand in candidates:
                cand_text = cand['text']
                ground_truth = cand['ground_truth_relevance']
                cand_skills = self.skill_extractor.extract_skills(cand_text)

                # 1. Keyword Overlap
                kw_score = TraditionalNLPMatcher.calculate_keyword_overlap(q_skills, cand_skills)

                # 2. TF-IDF Cosine
                tfidf_score = TraditionalNLPMatcher.calculate_tfidf_similarity(q_desc, cand_text)

                # 3. Sentence-BERT
                sbert_score = self.embedding_service.calculate_normalized_score(q_desc, cand_text)

                scored_candidates.append({
                    'resume_id': cand['resume_id'],
                    'name': cand['candidate_name'],
                    'ground_truth': ground_truth,
                    'scores': {
                        'keyword_overlap': kw_score,
                        'tfidf_cosine': tfidf_score,
                        'sentence_bert': sbert_score
                    }
                })

            query_perf = {'query_id': q_id, 'title': q_title, 'methods': {}}

            # Evaluate each method for this query
            for method in methods:
                # Sort candidates descending by predicted score
                ranked = sorted(scored_candidates, key=lambda x: x['scores'][method], reverse=True)
                
                # Binary relevance: ground_truth >= 1 is relevant
                relevances = [c['ground_truth'] for c in ranked]
                binary_rel = [1 if r >= 1 else 0 for r in relevances]
                total_relevant = sum(1 for c in scored_candidates if c['ground_truth'] >= 1)

                # Precision@K
                top_k = binary_rel[:k]
                p_at_k = sum(top_k) / k if k > 0 else 0.0

                # Recall@K
                r_at_k = sum(top_k) / total_relevant if total_relevant > 0 else 0.0

                # F1@K
                f1_at_k = (2 * p_at_k * r_at_k / (p_at_k + r_at_k)) if (p_at_k + r_at_k) > 0 else 0.0

                # MRR (Mean Reciprocal Rank) - 1 / rank of first relevant doc
                mrr = 0.0
                for rank_idx, rel in enumerate(binary_rel, 1):
                    if rel == 1:
                        mrr = 1.0 / rank_idx
                        break

                # NDCG@K
                ndcg = self._calculate_ndcg(relevances, k)

                method_metrics[method]['precision'].append(p_at_k)
                method_metrics[method]['recall'].append(r_at_k)
                method_metrics[method]['f1'].append(f1_at_k)
                method_metrics[method]['mrr'].append(mrr)
                method_metrics[method]['ndcg'].append(ndcg)

                query_perf['methods'][method] = {
                    'precision_at_k': round(p_at_k, 3),
                    'recall_at_k': round(r_at_k, 3),
                    'f1_at_k': round(f1_at_k, 3),
                    'mrr': round(mrr, 3),
                    'ndcg_at_k': round(ndcg, 3),
                    'ranking': [
                        {
                            'resume_id': c['resume_id'],
                            'name': c['name'],
                            'score': round(c['scores'][method], 2),
                            'relevance': c['ground_truth']
                        } for c in ranked
                    ]
                }

            detailed_query_results.append(query_perf)

        # Average aggregate metrics across queries
        summary = {}
        for method in methods:
            summary[method] = {
                'mean_precision_at_k': round(sum(method_metrics[method]['precision']) / len(queries), 3),
                'mean_recall_at_k': round(sum(method_metrics[method]['recall']) / len(queries), 3),
                'mean_f1_at_k': round(sum(method_metrics[method]['f1']) / len(queries), 3),
                'mean_mrr': round(sum(method_metrics[method]['mrr']) / len(queries), 3),
                'mean_ndcg_at_k': round(sum(method_metrics[method]['ndcg']) / len(queries), 3),
            }

        return {
            'metadata': dataset.get('metadata', {}),
            'k': k,
            'summary': summary,
            'query_results': detailed_query_results
        }

    def _calculate_ndcg(self, relevances: List[int], k: int) -> float:
        """Calculates Normalized Discounted Cumulative Gain at rank K."""
        rel_k = relevances[:k]
        dcg = sum((2**r - 1) / math.log2(idx + 1) for idx, r in enumerate(rel_k, 1))

        # Ideal ranking
        ideal_rel = sorted(relevances, reverse=True)[:k]
        idcg = sum((2**r - 1) / math.log2(idx + 1) for idx, r in enumerate(ideal_rel, 1))

        if idcg == 0:
            return 0.0
        return round(dcg / idcg, 3)
