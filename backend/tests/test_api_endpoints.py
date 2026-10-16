import pytest
import json
from app import create_app
from app.models import db, Job

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_health_endpoint(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'

def test_job_crud_lifecycle(client):
    # 1. Create Job
    job_payload = {
        'title': 'Senior Python Engineer',
        'department': 'Engineering',
        'description': 'Building microservices in Python with Flask and PostgreSQL.',
        'required_skills': ['Python', 'Flask', 'PostgreSQL'],
        'preferred_skills': ['Docker'],
        'min_experience_years': 3.0,
        'education_requirements': ["Bachelor's"]
    }
    res = client.post('/api/jobs', json=job_payload)
    assert res.status_code == 201
    created_job = res.get_json()['job']
    job_id = created_job['id']
    assert created_job['title'] == 'Senior Python Engineer'

    # 2. Get Jobs
    res_list = client.get('/api/jobs')
    assert res_list.status_code == 200
    assert len(res_list.get_json()['jobs']) == 1

    # 3. Get Single Job
    res_get = client.get(f'/api/jobs/{job_id}')
    assert res_get.status_code == 200
    assert res_get.get_json()['job']['min_experience_years'] == 3.0

    # 4. Update Job
    res_update = client.put(f'/api/jobs/{job_id}', json={'min_experience_years': 4.0})
    assert res_update.status_code == 200
    assert res_update.get_json()['job']['min_experience_years'] == 4.0

    # 5. Delete Job
    res_del = client.delete(f'/api/jobs/{job_id}')
    assert res_del.status_code == 200

    # Verify deleted
    res_get_del = client.get(f'/api/jobs/{job_id}')
    assert res_get_del.status_code == 404

def test_dashboard_stats(client):
    res = client.get('/api/dashboard/stats')
    assert res.status_code == 200
    data = res.get_json()
    assert 'metrics' in data
    assert 'charts' in data
