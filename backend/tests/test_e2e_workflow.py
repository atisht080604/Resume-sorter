import os
import io
import pytest
from app import create_app
from app.models import db, Job, Candidate, ScreeningSession, ScreeningResult

@pytest.fixture
def app_instance():
    test_db = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_e2e.db'))
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except Exception:
            pass

    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{test_db}'

    with app.app_context():
        db.create_all()

    yield app

    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except Exception:
            pass

def test_complete_e2e_screening_workflow(app_instance):
    with app_instance.test_client() as client:
        # Step 1: Health check
        health_res = client.get('/api/health')
        assert health_res.status_code == 200

        # Step 2: Create screening job
        job_payload = {
            'title': 'Senior Python Backend Engineer',
            'department': 'Cloud Engineering',
            'description': 'Senior Python Developer with microservices, FastAPI, Flask, PostgreSQL, Docker, and Redis experience.',
            'required_skills': ['Python', 'Flask', 'FastAPI', 'PostgreSQL', 'Docker'],
            'preferred_skills': ['Redis', 'AWS', 'Kubernetes'],
            'min_experience_years': 4.0,
            'education_requirements': ["Bachelor's", "Master's"],
            'certifications': ['AWS']
        }
        create_res = client.post('/api/jobs', json=job_payload)
        assert create_res.status_code == 201
        job_id = create_res.get_json()['job']['id']

        # Step 3: Prepare real sample files
        resumes_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../datasets/sample_resumes'))
        
        pdf_path = os.path.join(resumes_dir, 'arjun_sharma_senior_python_dev.pdf')
        docx_path = os.path.join(resumes_dir, 'priya_nair_fullstack_dev.docx')
        lead_docx_path = os.path.join(resumes_dir, 'ananya_roy_lead_architect.docx')
        frontend_pdf_path = os.path.join(resumes_dir, 'rohan_gupta_frontend_engineer.pdf')
        junior_pdf_path = os.path.join(resumes_dir, 'vikas_patel_junior_dev.pdf')
        scanned_pdf_path = os.path.join(resumes_dir, 'scanned_image_empty_resume.pdf')

        files_data = [
            ('resumes', (open(pdf_path, 'rb'), 'arjun_sharma_senior_python_dev.pdf')),
            ('resumes', (open(docx_path, 'rb'), 'priya_nair_fullstack_dev.docx')),
            ('resumes', (open(lead_docx_path, 'rb'), 'ananya_roy_lead_architect.docx')),
            ('resumes', (open(frontend_pdf_path, 'rb'), 'rohan_gupta_frontend_engineer.pdf')),
            ('resumes', (open(junior_pdf_path, 'rb'), 'vikas_patel_junior_dev.pdf')),
            ('resumes', (open(scanned_pdf_path, 'rb'), 'scanned_image_empty_resume.pdf')),
        ]

        # Step 4: Execute real screening upload
        post_data = {
            'job_id': str(job_id),
            'resumes': [
                (open(pdf_path, 'rb'), 'arjun_sharma_senior_python_dev.pdf'),
                (open(docx_path, 'rb'), 'priya_nair_fullstack_dev.docx'),
                (open(lead_docx_path, 'rb'), 'ananya_roy_lead_architect.docx'),
                (open(frontend_pdf_path, 'rb'), 'rohan_gupta_frontend_engineer.pdf'),
                (open(junior_pdf_path, 'rb'), 'vikas_patel_junior_dev.pdf'),
                (open(scanned_pdf_path, 'rb'), 'scanned_image_empty_resume.pdf'),
            ]
        }

        # Multipart form data with Flask test client
        screening_res = client.post(
            '/api/screenings',
            data=post_data,
            content_type='multipart/form-data'
        )

        assert screening_res.status_code == 201
        res_json = screening_res.get_json()
        assert res_json['status'] == 'success'
        session_id = res_json['session']['id']
        ranked_candidates = res_json['results']

        # Step 5: Check file validation results
        # The scanned PDF should be in file_errors
        errors = res_json.get('file_errors', [])
        assert any('scanned_image_empty_resume.pdf' in e.get('filename', '') for e in errors)

        # Exactly 5 valid resumes should be successfully screened and ranked
        assert len(ranked_candidates) == 5

        # Step 6: Verify Ranking order (Descending by composite score)
        for i in range(len(ranked_candidates) - 1):
            assert ranked_candidates[i]['composite_score'] >= ranked_candidates[i + 1]['composite_score']
            assert ranked_candidates[i]['rank'] == i + 1

        # The top candidates should be High Match (Ananya Roy or Arjun Sharma)
        top_cand = ranked_candidates[0]
        assert top_cand['match_category'] == 'High Match'
        assert top_cand['composite_score'] >= 75.0

        # Rohan Gupta (Frontend developer) should score lower on backend requirements
        rohan = next(c for c in ranked_candidates if 'rohan' in c['filename'].lower())
        assert rohan['composite_score'] < top_cand['composite_score']

        # Step 7: Verify Candidate Detail Endpoint & Explainability
        top_cand_id = top_cand['candidate_id']
        detail_res = client.get(f'/api/candidates/{top_cand_id}?session_id={session_id}')
        assert detail_res.status_code == 200
        detail_json = detail_res.get_json()['candidate']
        assert len(detail_json['current_screening']['explanation']['strengths']) > 0

        # Step 8: Verify Side-by-Side Comparison Endpoint
        cand_ids = [ranked_candidates[0]['candidate_id'], ranked_candidates[1]['candidate_id']]
        compare_res = client.get(f'/api/candidates/compare?candidate_ids={cand_ids[0]},{cand_ids[1]}')
        assert compare_res.status_code == 200
        compare_data = compare_res.get_json()['candidates']
        assert len(compare_data) == 2

        # Step 9: Verify CSV Export
        csv_res = client.get(f'/api/screenings/{session_id}/export?format=csv')
        assert csv_res.status_code == 200
        assert b'AI-Powered Resume Screening Report' in csv_res.data
        assert b'Final Composite Score' in csv_res.data

        # Step 10: Verify PDF Export
        pdf_res = client.get(f'/api/screenings/{session_id}/export?format=pdf')
        assert pdf_res.status_code == 200
        assert pdf_res.data.startswith(b'%PDF-')

        # Step 11: Verify Dashboard Stats Aggregation
        dash_res = client.get('/api/dashboard/stats')
        assert dash_res.status_code == 200
        metrics = dash_res.get_json()['metrics']
        assert metrics['total_jobs'] >= 1
        assert metrics['total_candidates_screened'] == 5
        assert metrics['high_match_count'] >= 1

        print("\nAll 11 End-to-End Acceptance Stages Succeeded!")
