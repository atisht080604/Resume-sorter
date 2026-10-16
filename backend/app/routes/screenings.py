import os
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.datastructures import FileStorage
from ..models import db, Job, Candidate, ScreeningSession, ScreeningResult
from ..utils.file_security import (
    is_allowed_file, generate_safe_filename,
    calculate_file_hash, validate_file_content
)
from ..services.document_parser import DocumentParser, DocumentParsingError
from ..services.skill_extractor import SkillExtractor
from ..services.embedding_service import EmbeddingService
from ..nlp.traditional_matcher import TraditionalNLPMatcher
from ..scoring.scorer import CandidateScorer
from ..services.report_generator import ReportGenerator

screenings_bp = Blueprint('screenings', __name__)

document_parser = DocumentParser()
skill_extractor = SkillExtractor()
embedding_service = EmbeddingService()

@screenings_bp.route('/screenings', methods=['POST'])
def create_screening():
    """
    Uploads multiple resumes, executes text extraction, NLP skill matching,
    Sentence-BERT semantic embedding, composite scoring, and ranks candidates.
    """
    job_id = request.form.get('job_id')
    if not job_id:
        return jsonify({'status': 'error', 'message': 'job_id is required.'}), 400

    job = db.session.get(Job, job_id)
    if not job:
        return jsonify({'status': 'error', 'message': f'Job with ID {job_id} not found.'}), 404

    # Extract uploaded files
    uploaded_files = request.files.getlist('resumes') or request.files.getlist('files')
    if not uploaded_files or len(uploaded_files) == 0 or (len(uploaded_files) == 1 and uploaded_files[0].filename == ''):
        return jsonify({'status': 'error', 'message': 'At least one resume file (PDF or DOCX) must be uploaded.'}), 400

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)

    # Initialize scorer with configured weights
    weights = current_app.config.get('SCORING_WEIGHTS')
    semantic_threshold = current_app.config.get('SEMANTIC_SKILL_THRESHOLD', 0.70)
    scorer = CandidateScorer(weights=weights)

    processed_candidates = []
    file_errors = []

    # Create ScreeningSession record
    session = ScreeningSession(job_id=job.id, status='processing')
    db.session.add(session)
    db.session.flush()

    seen_hashes_in_session = set()

    for file in uploaded_files:
        filename = file.filename
        if not filename:
            continue

        if not is_allowed_file(filename):
            file_errors.append({
                'filename': filename,
                'error': 'Unsupported file format. Only PDF and DOCX files are permitted.'
            })
            continue

        try:
            # Read file bytes into memory for validation & hashing
            file_bytes = file.read()
            is_valid, validation_msg = validate_file_content(file_bytes, filename)
            if not is_valid:
                file_errors.append({'filename': filename, 'error': validation_msg})
                continue

            file_hash = calculate_file_hash(file_bytes)
            if file_hash in seen_hashes_in_session:
                file_errors.append({
                    'filename': filename,
                    'error': 'Duplicate resume detected within the current screening batch.'
                })
                continue
            seen_hashes_in_session.add(file_hash)

            # Save file safely to disk
            safe_name = generate_safe_filename(filename)
            file_path = os.path.join(upload_folder, safe_name)
            with open(file_path, 'wb') as f_out:
                f_out.write(file_bytes)

            # Extract text
            raw_text = document_parser.extract_text(file_path)
            is_sufficient, suff_msg = document_parser.validate_content_sufficiency(raw_text)
            if not is_sufficient:
                file_errors.append({
                    'filename': filename,
                    'error': suff_msg
                })
                continue

            # Extract metadata and sections
            metadata = document_parser.extract_metadata(raw_text)
            
            # Extract skills using NLP ontology
            extracted_skills = skill_extractor.extract_skills(raw_text)

            # Persist or retrieve candidate record
            candidate = Candidate.query.filter_by(file_hash=file_hash).first()
            if not candidate:
                candidate = Candidate(
                    name=metadata.get('candidate_name') or 'Candidate',
                    email=metadata.get('email'),
                    phone=metadata.get('phone'),
                    filename=filename,
                    file_path=file_path,
                    file_hash=file_hash,
                    raw_text=raw_text,
                    extracted_skills=extracted_skills,
                    extracted_education=metadata.get('education') or [],
                    extracted_experience_years=metadata.get('experience_years') or 0.0,
                    extracted_certifications=[],
                    sections=metadata.get('sections') or {}
                )
                db.session.add(candidate)
                db.session.flush()

            # NLP Matching Pipelines:
            # 1. Traditional Baselines
            jaccard_score = TraditionalNLPMatcher.calculate_keyword_overlap(
                job.required_skills, extracted_skills
            )
            tfidf_score = TraditionalNLPMatcher.calculate_tfidf_similarity(
                job.description, raw_text
            )

            # 2. Sentence-BERT Semantic Matching
            semantic_score = embedding_service.calculate_normalized_score(
                job.description, raw_text
            )

            # 3. Skill Matching (exact, partial, missing)
            skills_match = skill_extractor.match_skills(
                required_skills=job.required_skills or [],
                preferred_skills=job.preferred_skills or [],
                candidate_skills=extracted_skills,
                semantic_model=embedding_service,
                semantic_threshold=semantic_threshold
            )

            # 4. Multi-Component Research Scoring
            candidate_dict = {
                'experience_years': candidate.extracted_experience_years,
                'education': candidate.extracted_education,
                'certifications': candidate.extracted_certifications
            }
            job_dict = {
                'required_skills': job.required_skills or [],
                'preferred_skills': job.preferred_skills or [],
                'min_experience_years': job.min_experience_years or 0.0,
                'education_requirements': job.education_requirements or [],
                'certifications': job.certifications or []
            }

            score_res = scorer.score_candidate(
                semantic_similarity_score=semantic_score,
                job_data=job_dict,
                candidate_data=candidate_dict,
                skills_match_data=skills_match
            )

            result = ScreeningResult(
                session_id=session.id,
                candidate_id=candidate.id,
                job_id=job.id,
                composite_score=score_res['composite_score'],
                match_category=score_res['match_category'],
                semantic_similarity_score=score_res['component_scores']['semantic_similarity'],
                required_skills_score=score_res['component_scores']['required_skills'],
                preferred_skills_score=score_res['component_scores']['preferred_skills'],
                experience_score=score_res['component_scores']['experience'],
                education_score=score_res['component_scores']['education'],
                certification_score=score_res['component_scores']['certification'],
                keyword_jaccard_score=jaccard_score,
                tfidf_cosine_score=tfidf_score,
                matched_required_skills=skills_match['matched_required'],
                matched_preferred_skills=skills_match['matched_preferred'],
                partial_skills=skills_match['partial_matches'],
                missing_required_skills=skills_match['missing_required'],
                missing_preferred_skills=skills_match['missing_preferred'],
                explanation=score_res['explanation']
            )
            db.session.add(result)
            processed_candidates.append(result)

        except DocumentParsingError as de:
            file_errors.append({'filename': filename, 'error': str(de)})
        except Exception as e:
            file_errors.append({'filename': filename, 'error': f"Unexpected processing error: {str(e)}"})

    if not processed_candidates:
        session.status = 'failed'
        session.notes = f"All {len(uploaded_files)} files failed processing."
        db.session.commit()
        return jsonify({
            'status': 'error',
            'message': 'No resumes could be successfully processed.',
            'errors': file_errors
        }), 400

    # Sort descending by composite score and assign rank
    processed_candidates.sort(key=lambda r: r.composite_score, reverse=True)
    for idx, res in enumerate(processed_candidates, 1):
        res.rank = idx

    # Aggregate session metrics
    high_cnt = sum(1 for r in processed_candidates if r.match_category == 'High Match')
    med_cnt = sum(1 for r in processed_candidates if r.match_category == 'Medium Match')
    low_cnt = sum(1 for r in processed_candidates if r.match_category == 'Low Match')
    avg_score = sum(r.composite_score for r in processed_candidates) / len(processed_candidates)

    session.total_resumes = len(processed_candidates)
    session.high_match_count = high_cnt
    session.medium_match_count = med_cnt
    session.low_match_count = low_cnt
    session.average_score = round(avg_score, 2)
    session.status = 'completed'
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f"Successfully screened {len(processed_candidates)} candidates.",
        'session': session.to_dict(),
        'results': [r.to_dict() for r in processed_candidates],
        'file_errors': file_errors
    }), 201

@screenings_bp.route('/screenings', methods=['GET'])
def get_screenings():
    """Returns list of all screening sessions."""
    sessions = ScreeningSession.query.order_by(ScreeningSession.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'count': len(sessions),
        'screenings': [s.to_dict() for s in sessions]
    }), 200

@screenings_bp.route('/screenings/<int:session_id>', methods=['GET'])
def get_screening_session(session_id):
    """Returns screening session details and ranked results."""
    session = db.session.get(ScreeningSession, session_id)
    if not session:
        return jsonify({'status': 'error', 'message': f'Screening session {session_id} not found.'}), 404

    return jsonify({
        'status': 'success',
        'session': session.to_dict(include_results=True)
    }), 200

@screenings_bp.route('/screenings/<int:session_id>/candidates', methods=['GET'])
def get_screening_candidates(session_id):
    """
    Returns candidate results for a session with search, filtering, and sorting.
    """
    session = db.session.get(ScreeningSession, session_id)
    if not session:
        return jsonify({'status': 'error', 'message': f'Screening session {session_id} not found.'}), 404

    category_filter = request.args.get('category')
    search_query = request.args.get('search', '').lower().strip()
    sort_by = request.args.get('sort_by', 'rank')
    sort_order = request.args.get('order', 'asc')

    query = ScreeningResult.query.filter_by(session_id=session.id)

    if category_filter and category_filter != 'all':
        query = query.filter_by(match_category=category_filter)

    results = query.all()

    # Search filter by candidate name, uid, or filename
    if search_query:
        filtered = []
        for r in results:
            cand_name = (r.candidate.name or '').lower()
            cand_uid = (r.candidate.candidate_uid or '').lower()
            cand_file = (r.candidate.filename or '').lower()
            if search_query in cand_name or search_query in cand_uid or search_query in cand_file:
                filtered.append(r)
        results = filtered

    # Sorting
    reverse_sort = (sort_order == 'desc')
    if sort_by == 'composite_score':
        results.sort(key=lambda r: r.composite_score, reverse=reverse_sort)
    elif sort_by == 'semantic_similarity':
        results.sort(key=lambda r: r.semantic_similarity_score, reverse=reverse_sort)
    elif sort_by == 'required_skills':
        results.sort(key=lambda r: r.required_skills_score, reverse=reverse_sort)
    elif sort_by == 'experience':
        results.sort(key=lambda r: r.experience_score, reverse=reverse_sort)
    else:
        # Default sort by rank
        results.sort(key=lambda r: (r.rank if r.rank is not None else 9999), reverse=reverse_sort)

    return jsonify({
        'status': 'success',
        'session_id': session.id,
        'count': len(results),
        'results': [r.to_dict() for r in results]
    }), 200

@screenings_bp.route('/screenings/<int:session_id>/export', methods=['GET'])
def export_screening_report(session_id):
    """
    Exports downloadable CSV or PDF reports with screening metrics and candidate breakdowns.
    """
    session = db.session.get(ScreeningSession, session_id)
    if not session:
        return jsonify({'status': 'error', 'message': f'Screening session {session_id} not found.'}), 404

    export_format = request.args.get('format', 'csv').lower()
    results = [r.to_dict() for r in session.results]
    session_data = session.to_dict()

    if export_format == 'pdf':
        pdf_buffer = ReportGenerator.generate_pdf(session_data, results)
        clean_title = (session.job.title if session.job else 'Screening').replace(' ', '_')
        filename = f"Screening_Report_{clean_title}_{session.session_uid}.pdf"
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    else:
        # CSV format
        csv_buffer = ReportGenerator.generate_csv(session_data, results)
        clean_title = (session.job.title if session.job else 'Screening').replace(' ', '_')
        filename = f"Screening_Report_{clean_title}_{session.session_uid}.csv"
        
        # Convert StringIO to BytesIO for send_file
        bytes_io = io = __import__('io').BytesIO(csv_buffer.getvalue().encode('utf-8'))
        return send_file(
            bytes_io,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
