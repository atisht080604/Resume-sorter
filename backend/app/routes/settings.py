from flask import Blueprint, request, jsonify, current_app
from ..services.skill_extractor import SkillExtractor
from ..models import db, SkillTaxonomy

settings_bp = Blueprint('settings', __name__)
skill_extractor = SkillExtractor()

@settings_bp.route('/settings', methods=['GET'])
def get_settings():
    """Returns current system configuration and scoring weights."""
    return jsonify({
        'status': 'success',
        'scoring_weights': current_app.config.get('SCORING_WEIGHTS'),
        'semantic_threshold': current_app.config.get('SEMANTIC_SKILL_THRESHOLD'),
        'model_name': current_app.config.get('EMBEDDING_MODEL_NAME'),
        'match_thresholds': {
            'high': current_app.config.get('HIGH_MATCH_THRESHOLD'),
            'medium': current_app.config.get('MEDIUM_MATCH_THRESHOLD')
        }
    }), 200

@settings_bp.route('/settings', methods=['PUT'])
def update_settings():
    """Updates runtime scoring weights and semantic thresholds."""
    payload = request.get_json() or {}

    new_weights = payload.get('scoring_weights')
    if new_weights:
        # Validate weights sum to 1.0
        try:
            total = sum(float(v) for v in new_weights.values())
            if abs(total - 1.0) > 0.01:
                return jsonify({
                    'status': 'error',
                    'message': f"Weights must sum to 1.0 (or 100%). Current sum: {round(total, 3)}"
                }), 400
            current_app.config['SCORING_WEIGHTS'] = {k: float(v) for k, v in new_weights.items()}
        except (ValueError, TypeError) as e:
            return jsonify({'status': 'error', 'message': f"Invalid weight values: {str(e)}"}), 400

    new_threshold = payload.get('semantic_threshold')
    if new_threshold is not None:
        try:
            thresh_val = float(new_threshold)
            if not (0.0 <= thresh_val <= 1.0):
                return jsonify({'status': 'error', 'message': 'Semantic threshold must be between 0.0 and 1.0'}), 400
            current_app.config['SEMANTIC_SKILL_THRESHOLD'] = thresh_val
        except (ValueError, TypeError):
            pass

    return jsonify({
        'status': 'success',
        'message': 'Settings updated successfully.',
        'scoring_weights': current_app.config.get('SCORING_WEIGHTS'),
        'semantic_threshold': current_app.config.get('SEMANTIC_SKILL_THRESHOLD')
    }), 200

@settings_bp.route('/settings/taxonomy', methods=['GET'])
def get_taxonomy():
    """Returns the complete technical skills dictionary categorized."""
    return jsonify({
        'status': 'success',
        'taxonomy': skill_extractor.taxonomy,
        'canonical_count': len(skill_extractor.canonical_skills)
    }), 200
