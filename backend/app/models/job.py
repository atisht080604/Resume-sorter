from datetime import datetime
from . import db

class Job(db.Model):
    __tablename__ = 'jobs'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False, index=True)
    department = db.Column(db.String(100), default='Engineering')
    description = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.JSON, default=list)
    preferred_skills = db.Column(db.JSON, default=list)
    min_experience_years = db.Column(db.Float, default=0.0)
    education_requirements = db.Column(db.JSON, default=list)
    certifications = db.Column(db.JSON, default=list)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    screening_sessions = db.relationship('ScreeningSession', back_populates='job', cascade='all, delete-orphan')
    screening_results = db.relationship('ScreeningResult', back_populates='job', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'department': self.department,
            'description': self.description,
            'required_skills': self.required_skills or [],
            'preferred_skills': self.preferred_skills or [],
            'min_experience_years': self.min_experience_years or 0.0,
            'education_requirements': self.education_requirements or [],
            'certifications': self.certifications or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'screening_count': len(self.screening_sessions)
        }
