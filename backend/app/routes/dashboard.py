from flask import Blueprint, jsonify
from sqlalchemy import func
from ..models import db, Job, Candidate, ScreeningSession, ScreeningResult

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """
    Returns live aggregated dashboard metrics, charts, and activity data.
    """
    total_jobs = Job.query.count()
    total_candidates = Candidate.query.count()
    total_screenings = ScreeningSession.query.count()
    total_screened_results = ScreeningResult.query.count()

    # Category counts
    high_match_count = ScreeningResult.query.filter_by(match_category='High Match').count()
    medium_match_count = ScreeningResult.query.filter_by(match_category='Medium Match').count()
    low_match_count = ScreeningResult.query.filter_by(match_category='Low Match').count()

    # Average score
    avg_score_row = db.session.query(func.avg(ScreeningResult.composite_score)).scalar()
    avg_score = round(float(avg_score_row), 2) if avg_score_row is not None else 0.0

    # Recent screening sessions (last 5)
    recent_sessions = (
        ScreeningSession.query
        .order_by(ScreeningSession.created_at.desc())
        .limit(5)
        .all()
    )

    # Match distribution for charts
    match_distribution = [
        {'name': 'High Match (≥75%)', 'value': high_match_count, 'color': '#10B981'},
        {'name': 'Medium Match (50-74%)', 'value': medium_match_count, 'color': '#F59E0B'},
        {'name': 'Low Match (<50%)', 'value': low_match_count, 'color': '#EF4444'}
    ]

    # Recent activity items
    recent_activities = []
    for s in recent_sessions:
        recent_activities.append({
            'id': s.id,
            'session_uid': s.session_uid,
            'title': f"Screened {s.total_resumes} resumes for {s.job.title if s.job else 'Unknown Job'}",
            'time': s.created_at.isoformat() if s.created_at else None,
            'avg_score': round(s.average_score, 1),
            'high_count': s.high_match_count
        })

    return jsonify({
        'status': 'success',
        'metrics': {
            'total_jobs': total_jobs,
            'total_resumes_processed': total_candidates,
            'total_candidates_screened': total_screened_results,
            'total_screening_sessions': total_screenings,
            'high_match_count': high_match_count,
            'medium_match_count': medium_match_count,
            'low_match_count': low_match_count,
            'average_score': avg_score
        },
        'charts': {
            'match_distribution': match_distribution
        },
        'recent_sessions': [s.to_dict() for s in recent_sessions],
        'recent_activities': recent_activities
    }), 200
