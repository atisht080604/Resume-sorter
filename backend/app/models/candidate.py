import uuid
from datetime import datetime
from . import db

class Candidate(db.Model):
    __tablename__ = 'candidates'

    id = db.Column(db.Integer, primary_key=True)
    candidate_uid = db.Column(db.String(64), unique=True, index=True, default=lambda: f"CAND-{uuid.uuid4().hex[:8].upper()}")
    name = db.Column(db.String(150), default='Candidate')
    email = db.Column(db.String(150), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_hash = db.Column(db.String(64), index=True)
    raw_text = db.Column(db.Text, nullable=False)
    extracted_skills = db.Column(db.JSON, default=list)
    extracted_education = db.Column(db.JSON, default=list)
    extracted_experience_years = db.Column(db.Float, default=0.0)
    extracted_certifications = db.Column(db.JSON, default=list)
    sections = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    screening_results = db.relationship('ScreeningResult', back_populates='candidate', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'candidate_uid': self.candidate_uid,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'filename': self.filename,
            'file_hash': self.file_hash,
            'extracted_skills': self.extracted_skills or [],
            'extracted_education': self.extracted_education or [],
            'extracted_experience_years': self.extracted_experience_years or 0.0,
            'extracted_certifications': self.extracted_certifications or [],
            'sections': self.sections or {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
