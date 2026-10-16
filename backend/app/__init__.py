import os
from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config
from .models import db

def create_app(config_class=Config):
    """Application factory for Flask REST API."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for all frontend origins
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)

    # Ensure uploads folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register API Blueprints
    from .routes.health import health_bp
    from .routes.dashboard import dashboard_bp
    from .routes.jobs import jobs_bp
    from .routes.screenings import screenings_bp
    from .routes.candidates import candidates_bp
    from .routes.evaluation import evaluation_bp
    from .routes.settings import settings_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(dashboard_bp, url_prefix='/api')
    app.register_blueprint(jobs_bp, url_prefix='/api')
    app.register_blueprint(screenings_bp, url_prefix='/api')
    app.register_blueprint(candidates_bp, url_prefix='/api')
    app.register_blueprint(evaluation_bp, url_prefix='/api')
    app.register_blueprint(settings_bp, url_prefix='/api')

    # Centralized Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'status': 'error', 'message': getattr(error, 'description', 'Bad Request')}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'status': 'error', 'message': getattr(error, 'description', 'Resource Not Found')}), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({'status': 'error', 'message': 'Uploaded file exceeds the 16MB maximum limit.'}), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({'status': 'error', 'message': 'An internal server error occurred.'}), 500

    # Auto-initialize database tables within app context
    with app.app_context():
        db.create_all()

    return app
