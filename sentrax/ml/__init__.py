"""
Machine Learning Module for SentraX URL Threat Detection

Provides:
- feature_extractor: Feature extraction from URLs
- ml_analyzer: ML model prediction and fallback logic
"""

from ml.feature_extractor import URLFeatureExtractor, extract_features_from_url, get_feature_names
from ml.ml_analyzer import MLAnalyzer, get_ml_analyzer, load_ml_model, predict_url

__all__ = [
    'URLFeatureExtractor',
    'extract_features_from_url',
    'get_feature_names',
    'MLAnalyzer',
    'get_ml_analyzer',
    'load_ml_model',
    'predict_url',
]
