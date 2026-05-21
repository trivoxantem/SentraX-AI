#!/usr/bin/env python3
"""Quick test of v1 vs v2 models."""

import joblib
from ml.feature_extractor import URLFeatureExtractor

# Test URLs
test_urls = [
    'https://www.google.com',
    'https://www.forbes.com',
    'mp3raid.com/music/test.html'
]

print("Testing BOTH models:\n")

# Test v1
try:
    print("=" * 60)
    print("V1 MODEL (RandomForest):")
    print("=" * 60)
    v1_model = joblib.load('models/url_model.pkl')
    for url in test_urls:
        extractor = URLFeatureExtractor(url)
        features = extractor.extract_all_features()
        pred = v1_model.predict([features])[0]
        proba = v1_model.predict_proba([features])[0]
        risk = int(proba[1] * 100)
        status = 'dangerous' if risk > 75 else 'suspicious' if risk > 40 else 'safe'
        print(f'{url:50} -> {risk:3}% ({status})')
except Exception as e:
    print(f"V1 Error: {e}")

print("\n")

# Test v2
try:
    print("=" * 60)
    print("V2 MODEL (GradientBoosting):")
    print("=" * 60)
    v2_model = joblib.load('models/url_model_v2.pkl')
    for url in test_urls:
        extractor = URLFeatureExtractor(url)
        features = extractor.extract_all_features()
        pred = v2_model.predict([features])[0]
        proba = v2_model.predict_proba([features])[0]
        risk = int(proba[1] * 100)
        status = 'dangerous' if risk > 75 else 'suspicious' if risk > 40 else 'safe'
        print(f'{url:50} -> {risk:3}% ({status})')
except Exception as e:
    print(f"V2 Error: {e}")
