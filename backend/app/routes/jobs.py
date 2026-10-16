from flask import Blueprint, request, jsonify
from ..models import db, Job, ScreeningSession
from ..services.skill_extractor import SkillExtractor

jobs_bp = Blueprint('jobs', __name__)
skill_extractor = SkillExtractor()

@jobs_bp.route('/jobs', methods=['GET'])
def get_jobs():
    """Returns list of all screening jobs."""
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'count': len(jobs),
        'jobs': [j.to_dict() for j in jobs]
    }), 200

@jobs_bp.route('/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """Returns single job details and past screenings."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'status': 'error', 'message': f'Job with ID {job_id} not found.'}), 404

    data = job.to_dict()
    data['screenings'] = [s.to_dict() for s in job.screening_sessions]
    return jsonify({'status': 'success', 'job': data}), 200

@jobs_bp.route('/jobs', methods=['POST'])
def create_job():
    """Creates a new screening job with field validation."""
    payload = request.get_json() or {}

    title = payload.get('title', '').strip()
    description = payload.get('description', '').strip()
    department = payload.get('department', 'Engineering').strip()
    min_exp = payload.get('min_experience_years', 0.0)

    if not title:
        return jsonify({'status': 'error', 'message': 'Job title is required.'}), 400
    if not description:
        return jsonify({'status': 'error', 'message': 'Job description is required.'}), 400

    try:
        min_exp = float(min_exp)
        if min_exp < 0:
            min_exp = 0.0
    except (ValueError, TypeError):
        min_exp = 0.0

    # Skills can be provided or automatically extracted if not explicitly supplied
    required_skills = payload.get('required_skills', [])
    if isinstance(required_skills, str):
        required_skills = [s.strip() for s in required_skills.split(',') if s.strip()]

    # If no required skills passed, auto-extract from description
    if not required_skills and description:
        required_skills = skill_extractor.extract_skills(description)

    preferred_skills = payload.get('preferred_skills', [])
    if isinstance(preferred_skills, str):
        preferred_skills = [s.strip() for s in preferred_skills.split(',') if s.strip()]

    education_requirements = payload.get('education_requirements', [])
    if isinstance(education_requirements, str):
        education_requirements = [e.strip() for e in education_requirements.split(',') if e.strip()]

    certifications = payload.get('certifications', [])
    if isinstance(certifications, str):
        certifications = [c.strip() for c in certifications.split(',') if c.strip()]

    new_job = Job(
        title=title,
        department=department,
        description=description,
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        min_experience_years=min_exp,
        education_requirements=education_requirements,
        certifications=certifications
    )

    db.session.add(new_job)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Job created successfully.',
        'job': new_job.to_dict()
    }), 201

@jobs_bp.route('/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    """Updates an existing job."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'status': 'error', 'message': f'Job with ID {job_id} not found.'}), 404

    payload = request.get_json() or {}

    if 'title' in payload:
        title = payload['title'].strip()
        if not title:
            return jsonify({'status': 'error', 'message': 'Job title cannot be empty.'}), 400
        job.title = title

    if 'department' in payload:
        job.department = payload['department'].strip()

    if 'description' in payload:
        desc = payload['description'].strip()
        if not desc:
            return jsonify({'status': 'error', 'message': 'Job description cannot be empty.'}), 400
        job.description = desc

    if 'required_skills' in payload:
        req = payload['required_skills']
        job.required_skills = [s.strip() for s in req.split(',') if s.strip()] if isinstance(req, str) else req

    if 'preferred_skills' in payload:
        pref = payload['preferred_skills']
        job.preferred_skills = [s.strip() for s in pref.split(',') if s.strip()] if isinstance(pref, str) else pref

    if 'min_experience_years' in payload:
        try:
            job.min_experience_years = max(0.0, float(payload['min_experience_years']))
        except (ValueError, TypeError):
            pass

    if 'education_requirements' in payload:
        edu = payload['education_requirements']
        job.education_requirements = [e.strip() for e in edu.split(',') if e.strip()] if isinstance(edu, str) else edu

    if 'certifications' in payload:
        certs = payload['certifications']
        job.certifications = [c.strip() for c in certs.split(',') if c.strip()] if isinstance(certs, str) else certs

    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': 'Job updated successfully.',
        'job': job.to_dict()
    }), 200

@jobs_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Deletes a job and associated screening records."""
    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'status': 'error', 'message': f'Job with ID {job_id} not found.'}), 404

    db.session.delete(job)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f'Job {job_id} deleted successfully.'
    }), 200

@jobs_bp.route('/jobs/<int:job_id>/screenings', methods=['GET'])
def get_job_screenings(job_id):
    """Returns past screening sessions for this job."""
    job = Job.query.get(job_id)
    if not job:
        return jsonify({'status': 'error', 'message': f'Job with ID {job_id} not found.'}), 404

    screenings = [s.to_dict() for s in job.screening_sessions]
    return jsonify({
        'status': 'success',
        'job_id': job_id,
        'job_title': job.title,
        'screenings': screenings
    }), 200
