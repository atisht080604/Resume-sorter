import uuid
from datetime import datetime
from . import db

class ScreeningSession(db.Model):
    __tablename__ = 'screening_sessions'

    id = db.Column(db.Integer, primary_key=True)
    session_uid = db.Column(db.String(64), unique=True, index=True, default=lambda: f"SESS-{uuid.uuid4().hex[:8].upper()}")
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    total_resumes = db.Column(db.Integer, default=0)
    high_match_count = db.Column(db.Integer, default=0)
    medium_match_count = db.Column(db.Integer, default=0)
    low_match_count = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='completed')  # 'processing', 'completed', 'failed'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    job = db.relationship('Job', back_populates='screening_sessions')
    results = db.relationship('ScreeningResult', back_populates='session', cascade='all, delete-orphan', order_by='ScreeningResult.rank')

    def to_dict(self, include_results=False):
        data = {
            'id': self.id,
            'session_uid': self.session_uid,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else 'Unknown Job',
            'department': self.job.department if self.job else '',
            'total_resumes': self.total_resumes,
            'high_match_count': self.high_match_count,
            'medium_match_count': self.medium_match_count,
            'low_match_count': self.low_match_count,
            'average_score': round(self.average_score, 2),
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_results:
            data['results'] = [r.to_dict() for r in self.results]
        return data


class ScreeningResult(db.Model):
    __tablename__ = 'screening_results'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('screening_sessions.id', ondelete='CASCADE'), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False)
    
    rank = db.Column(db.Integer, nullable=True)
    composite_score = db.Column(db.Float, nullable=False)
    match_category = db.Column(db.String(20), nullable=False)  # 'High Match', 'Medium Match', 'Low Match'
    
    # 6 Component Scores (0 - 100)
    semantic_similarity_score = db.Column(db.Float, nullable=False)
    required_skills_score = db.Column(db.Float, nullable=False)
    preferred_skills_score = db.Column(db.Float, nullable=False)
    experience_score = db.Column(db.Float, nullable=False)
    education_score = db.Column(db.Float, nullable=False)
    certification_score = db.Column(db.Float, nullable=False)
    
    # Traditional NLP Baseline Scores (for research comparison)
    keyword_jaccard_score = db.Column(db.Float, default=0.0)
    tfidf_cosine_score = db.Column(db.Float, default=0.0)
    
    # Skill Match Breakdown
    matched_required_skills = db.Column(db.JSON, default=list)
    matched_preferred_skills = db.Column(db.JSON, default=list)
    partial_skills = db.Column(db.JSON, default=list)
    missing_required_skills = db.Column(db.JSON, default=list)
    missing_preferred_skills = db.Column(db.JSON, default=list)
    
    # Explainability Data
    explanation = db.Column(db.JSON, default=dict)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    session = db.relationship('ScreeningSession', back_populates='results')
    candidate = db.relationship('Candidate', back_populates='screening_results')
    job = db.relationship('Job', back_populates='screening_results')

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'candidate_id': self.candidate_id,
            'candidate_uid': self.candidate.candidate_uid if self.candidate else None,
            'candidate_name': self.candidate.name if self.candidate else 'Candidate',
            'filename': self.candidate.filename if self.candidate else '',
            'email': self.candidate.email if self.candidate else None,
            'phone': self.candidate.phone if self.candidate else None,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else '',
            'rank': self.rank,
            'composite_score': round(self.composite_score, 2),
            'match_category': self.match_category,
            'scores': {
                'semantic_similarity': round(self.semantic_similarity_score, 2),
                'required_skills': round(self.required_skills_score, 2),
                'preferred_skills': round(self.preferred_skills_score, 2),
                'experience': round(self.experience_score, 2),
                'education': round(self.education_score, 2),
                'certification': round(self.certification_score, 2),
                'keyword_jaccard': round(self.keyword_jaccard_score, 2),
                'tfidf_cosine': round(self.tfidf_cosine_score, 2),
            },
            'skills_breakdown': {
                'matched_required': self.matched_required_skills or [],
                'matched_preferred': self.matched_preferred_skills or [],
                'partial_matches': self.partial_skills or [],
                'missing_required': self.missing_required_skills or [],
                'missing_preferred': self.missing_preferred_skills or [],
            },
            'candidate_extracted': {
                'skills': self.candidate.extracted_skills if self.candidate else [],
                'education': self.candidate.extracted_education if self.candidate else [],
                'experience_years': self.candidate.extracted_experience_years if self.candidate else 0.0,
                'certifications': self.candidate.extracted_certifications if self.candidate else [],
                'sections': self.candidate.sections if self.candidate else {},
            },
            'explanation': self.explanation or {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
