"""
Machine Learning Analyzer for URL Phishing Detection
======================================================

This module loads the trained ML model and uses it to predict URL threats.
Supports both v1 (RandomForest) and v2 (GradientBoosting) models.
Includes fallback to rule-based analyzer if ML model is unavailable.
"""

import os
import logging
import joblib
from pathlib import Path
from typing import Dict, Optional, Tuple

from ml.feature_extractor import URLFeatureExtractor, extract_features_from_url

logger = logging.getLogger(__name__)

# Get the base path for the models directory
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_V2_PATH = BASE_DIR / 'models' / 'url_model_v2.pkl'
MODEL_V1_PATH = BASE_DIR / 'models' / 'url_model.pkl'
FEATURES_V2_PATH = BASE_DIR / 'models' / 'url_model_v2_features.pkl'
FEATURES_V1_PATH = BASE_DIR / 'models' / 'url_model_features.pkl'


class MLAnalyzer:
    """
    Machine Learning based URL threat analyzer.
    
    Tries to load v2 (GradientBoosting) model first, falls back to v1 (RandomForest),
    then falls back to rule-based analyzer if both ML models unavailable.
    
    Uses probability-based scoring with updated thresholds:
    - 0-40%: Safe
    - 41-75%: Suspicious
    - 76-100%: Dangerous
    """
    
    def __init__(self, model_path: str = None, use_fallback: bool = True):
        """
        Initialize ML Analyzer.
        
        Args:
            model_path: Path to saved model (pkl file) - tries v2 first
            use_fallback: Whether to use rule-based analyzer as fallback
        """
        self.use_fallback = use_fallback
        self.model = None
        self.feature_names = None
        self.model_loaded = False
        self.model_version = None
        
        self._load_model()
    
    def _load_model(self):
        """Load pre-trained model from disk. Tries v2 first, then v1."""
        # Try loading v2 model (GradientBoosting - production)
        if os.path.exists(str(MODEL_V2_PATH)):
            try:
                logger.info(f"[ML] Loading v2 model (GradientBoosting) from {MODEL_V2_PATH}...")
                self.model = joblib.load(str(MODEL_V2_PATH))
                self.model_version = 'v2'
                
                # Load feature names
                if os.path.exists(str(FEATURES_V2_PATH)):
                    self.feature_names = joblib.load(str(FEATURES_V2_PATH))
                
                self.model_loaded = True
                logger.info("[ML] ✅ v2 Model loaded successfully! (GradientBoosting)")
                return
            except Exception as e:
                logger.warning(f"[ML] Failed to load v2 model: {e}")
        
        # Fallback: Try loading v1 model (RandomForest)
        if os.path.exists(str(MODEL_V1_PATH)):
            try:
                logger.info(f"[ML] Loading v1 model (RandomForest) from {MODEL_V1_PATH}...")
                self.model = joblib.load(str(MODEL_V1_PATH))
                self.model_version = 'v1'
                
                # Load feature names
                if os.path.exists(str(FEATURES_V1_PATH)):
                    self.feature_names = joblib.load(str(FEATURES_V1_PATH))
                
                self.model_loaded = True
                logger.info("[ML] ✅ v1 Model loaded successfully! (RandomForest) - Consider upgrading to v2")
                return
            except Exception as e:
                logger.warning(f"[ML] Failed to load v1 model: {e}")
        
        # No model found
        logger.warning("[ML] ⚠️  No ML model found")
        logger.warning(f"[ML] Expected paths:")
        logger.warning(f"[ML]   - {MODEL_V2_PATH}")
        logger.warning(f"[ML]   - {MODEL_V1_PATH}")
        logger.warning("[ML] Run: python train_model_v2.py to train v2 model")
        logger.warning("[ML] Or:  python train_model.py to train v1 model")
        
        self.model_loaded = False
    
    def predict(self, url: str) -> Dict:
        """
        Predict URL threat using ML model.
        
        Uses probability-based scoring with thresholds:
        - 0-40%: Safe
        - 41-75%: Suspicious
        - 76-100%: Dangerous
        
        Args:
            url: URL to analyze
            
        Returns:
            dict: {
                'status': 'safe'|'suspicious'|'dangerous',
                'risk_score': 0-100,
                'confidence': 0-1,
                'model_used': True,
                'model_version': 'v2'|'v1',
                'phishing_probability': 0-1,
                'features': {...}
            }
        """
        if not self.model_loaded:
            logger.warning("[ML] Model not loaded, using fallback")
            return self._fallback_analyze(url)
        
        try:
            logger.info(f"[ML] [{self.model_version.upper()}] Analyzing URL: {url}")
            
            # Extract features  
            extractor = URLFeatureExtractor(url)
            features = extractor.extract_all_features()
            
            # IMPORTANT: V1 model expects 14 features, V2 expects 21
            # For V1: use only the first 14 features
            # For V2: use all 21 features
            if self.model_version == 'v1':
                features = features[:14]  # Use first 14 for v1
            features_dict = extractor.features
            
            # Make prediction
            prediction = self.model.predict([features])[0]  # 0 = safe, 1 = phishing
            
            # Get prediction probabilities
            probabilities = self.model.predict_proba([features])[0]
            
            # Confidence = max probability
            confidence = float(max(probabilities))
            
            # Phishing probability (probability of class 1)
            phishing_probability = float(probabilities[1])
            
            # Convert probability to risk score (0-100)
            risk_score = int(phishing_probability * 100)
            
            # Determine status using NEW THRESHOLDS
            # 0-40: Safe, 41-75: Suspicious, 76-100: Dangerous
            if risk_score <= 40:
                status = 'safe'
            elif risk_score <= 75:
                status = 'suspicious'
            else:
                status = 'dangerous'
            
            logger.info(f"[ML] [{self.model_version.upper()}] Prediction: {prediction}, Risk Score: {risk_score}%, Confidence: {confidence:.2%}")
            
            return {
                'status': status,
                'risk_score': risk_score,
                'confidence': confidence,
                'model_used': True,
                'model_version': self.model_version,
                'prediction': int(prediction),
                'phishing_probability': phishing_probability,
                'features': features_dict
            }
            
        except Exception as e:
            logger.error(f"[ML] [{self.model_version.upper() if self.model_version else 'UNKNOWN'}] Error making prediction: {e}")
            if self.use_fallback:
                logger.info("[ML] Using fallback rule-based analyzer")
                return self._fallback_analyze(url)
            else:
                raise
    
    def _fallback_analyze(self, url: str) -> Dict:
        """
        Fallback to rule-based analyzer if ML model fails.
        
        Uses the existing URLAnalyzer for safety.
        
        Args:
            url: URL to analyze
            
        Returns:
            dict: Analysis result with model_used=False
        """
        try:
            from app.utils.url_analyzer import analyze_url
            
            logger.info(f"[ML] Using fallback rule-based analyzer for: {url}")
            result = analyze_url(url)
            result['model_used'] = False
            result['fallback_reason'] = 'ML model unavailable'
            
            return result
            
        except Exception as e:
            logger.error(f"[ML] Fallback analyzer also failed: {e}")
            return {
                'status': 'safe',
                'risk_score': 0,
                'model_used': False,
                'error': str(e)
            }


# Global model instance
_ml_analyzer = None


def get_ml_analyzer() -> MLAnalyzer:
    """
    Get or create global ML analyzer instance.
    
    Returns:
        MLAnalyzer: Singleton instance
    """
    global _ml_analyzer
    if _ml_analyzer is None:
        _ml_analyzer = MLAnalyzer()
    return _ml_analyzer


def load_ml_model() -> MLAnalyzer:
    """
    Alias for get_ml_analyzer() for backwards compatibility.
    
    Returns:
        MLAnalyzer: ML analyzer instance
    """
    return get_ml_analyzer()


def predict_url(url: str) -> Dict:
    """
    Convenience function to predict URL threat.
    
    Args:
        url: URL to analyze
        
    Returns:
        dict: Prediction result
    """
    analyzer = get_ml_analyzer()
    return analyzer.predict(url)


if __name__ == '__main__':
    # Test the analyzer
    print("Testing ML Analyzer...")
    
    test_urls = [
        'https://www.google.com',
        'https://bank-verify.tk',
        'https://verify-account.com',
    ]
    
    analyzer = get_ml_analyzer()
    
    if analyzer.model_loaded:
        for url in test_urls:
            result = analyzer.predict(url)
            print(f"\nURL: {url}")
            print(f"Status: {result['status']}")
            print(f"Risk Score: {result['risk_score']}")
            print(f"Confidence: {result['confidence']:.2%}")
    else:
        print("Model not loaded. Train with: python train_model.py")
