from flask import Blueprint, request, jsonify
from ..models import db, Candidate, ScreeningResult

candidates_bp = Blueprint('candidates', __name__)

@candidates_bp.route('/candidates/<int:candidate_id>', methods=['GET'])
def get_candidate(candidate_id):
    """
    Returns full candidate detail, extracted resume data, and screening results.
    """
    candidate = db.session.get(Candidate, candidate_id)
    if not candidate:
        return jsonify({'status': 'error', 'message': f'Candidate with ID {candidate_id} not found.'}), 404

    data = candidate.to_dict()
    # Include all screening results this candidate has participated in
    data['screening_history'] = [r.to_dict() for r in candidate.screening_results]
    
    # If session_id query param is provided, highlight that specific screening result
    session_id = request.args.get('session_id')
    if session_id:
        specific_result = ScreeningResult.query.filter_by(
            candidate_id=candidate.id, session_id=session_id
        ).first()
        data['current_screening'] = specific_result.to_dict() if specific_result else None
    elif candidate.screening_results:
        # Default to latest screening result
        data['current_screening'] = candidate.screening_results[-1].to_dict()
    else:
        data['current_screening'] = None

    return jsonify({'status': 'success', 'candidate': data}), 200

@candidates_bp.route('/candidates/compare', methods=['GET'])
def compare_candidates():
    """
    Compares 2 to 4 candidates side-by-side using candidate IDs or screening result IDs.
    Query parameter: ?result_ids=1,2,3 or ?candidate_ids=1,2,3
    """
    result_ids_str = request.args.get('result_ids', '')
    candidate_ids_str = request.args.get('candidate_ids', '')

    if result_ids_str:
        try:
            ids = [int(i.strip()) for i in result_ids_str.split(',') if i.strip()]
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Invalid result_ids format.'}), 400

        results = ScreeningResult.query.filter(ScreeningResult.id.in_(ids)).all()
        if not results:
            return jsonify({'status': 'error', 'message': 'No candidates found for comparison.'}), 404

        comparison_data = [r.to_dict() for r in results]
        return jsonify({
            'status': 'success',
            'count': len(comparison_data),
            'candidates': comparison_data
        }), 200

    elif candidate_ids_str:
        try:
            ids = [int(i.strip()) for i in candidate_ids_str.split(',') if i.strip()]
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Invalid candidate_ids format.'}), 400

        candidates = Candidate.query.filter(Candidate.id.in_(ids)).all()
        if not candidates:
            return jsonify({'status': 'error', 'message': 'No candidates found for comparison.'}), 404

        comparison_data = []
        for c in candidates:
            c_dict = c.to_dict()
            latest_res = c.screening_results[-1].to_dict() if c.screening_results else None
            c_dict['screening_result'] = latest_res
            comparison_data.append(c_dict)

        return jsonify({
            'status': 'success',
            'count': len(comparison_data),
            'candidates': comparison_data
        }), 200

    else:
        return jsonify({
            'status': 'error',
            'message': 'Provide either ?result_ids=1,2 or ?candidate_ids=1,2 parameter.'
        }), 400
