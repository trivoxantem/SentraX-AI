from django.apps import AppConfig


class AppConfig(AppConfig):
    name = 'app'
    
    def ready(self):
        """Initialize ML model when Django starts."""
        try:
            from ml.ml_analyzer import get_ml_analyzer
            # Load ML model at startup
            get_ml_analyzer()
        except Exception as e:
            print(f"[ML] Warning: Could not initialize ML model: {e}")
