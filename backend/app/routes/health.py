from flask import Blueprint, jsonify

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'AI-Powered Resume Screening System',
        'version': '1.0.0',
        'model': 'sentence-transformers/all-MiniLM-L6-v2',
        'database': 'SQLite'
    }), 200
