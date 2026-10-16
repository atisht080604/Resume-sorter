import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mca-resume-screening-secret-key-2026')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', f"sqlite:///{os.path.join(basedir, 'resume_screening.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max payload
    ALLOWED_EXTENSIONS = {'pdf', 'docx'}
    
    # NLP Model Configuration
    EMBEDDING_MODEL_NAME = os.environ.get('EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
    SEMANTIC_SKILL_THRESHOLD = float(os.environ.get('SEMANTIC_SKILL_THRESHOLD', '0.70'))
    
    # Research Formula Scoring Weights (must sum to 1.0)
    SCORING_WEIGHTS = {
        'semantic_similarity': 0.40,
        'required_skills': 0.25,
        'preferred_skills': 0.15,
        'experience': 0.10,
        'education': 0.05,
        'certification': 0.05
    }
    
    # Decision support thresholds
    HIGH_MATCH_THRESHOLD = 75.0
    MEDIUM_MATCH_THRESHOLD = 50.0
