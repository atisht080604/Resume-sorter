from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .job import Job
from .candidate import Candidate
from .screening import ScreeningSession, ScreeningResult
from .taxonomy import SkillTaxonomy

__all__ = ['db', 'Job', 'Candidate', 'ScreeningSession', 'ScreeningResult', 'SkillTaxonomy']
