from flask import Blueprint, request, jsonify
from ..evaluation.benchmark import ResearchBenchmarkEvaluator

evaluation_bp = Blueprint('evaluation', __name__)
evaluator = ResearchBenchmarkEvaluator()

@evaluation_bp.route('/evaluation/benchmark', methods=['GET', 'POST'])
def run_benchmark():
    """
    Executes the research benchmark evaluation pipeline comparing:
    1. Keyword Overlap
    2. TF-IDF Cosine Similarity
    3. Sentence-BERT Semantic Matching
    Returns precision, recall, F1, MRR, and NDCG@K metrics on documented dataset.
    """
    k = request.args.get('k', 3, type=int)
    try:
        results = evaluator.run_benchmark(k=k)
        return jsonify({
            'status': 'success',
            'benchmark': results
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"Benchmark evaluation failed: {str(e)}"
        }), 500
