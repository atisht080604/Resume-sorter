from . import db

class SkillTaxonomy(db.Model):
    __tablename__ = 'skill_taxonomy'

    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(100), nullable=False)
    canonical_name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    aliases = db.Column(db.JSON, default=list)
    related_skills = db.Column(db.JSON, default=list)

    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'canonical_name': self.canonical_name,
            'aliases': self.aliases or [],
            'related_skills': self.related_skills or []
        }
