#!/usr/bin/env python3
"""Test model with different URL formats."""

from ml.ml_analyzer import get_ml_analyzer

analyzer = get_ml_analyzer()

test_urls = [
    'https://www.google.com',      # Full URL
    'google.com',                  # Domain only (like training data)
    'https://bopsecrets.org/rexroth/cr/1.htm',  # Like training data
    'bopsecrets.org/rexroth/cr/1.htm',           # Domain+path
    'mp3raid.com/music/test.html'  # Known benign from dataset
]

print("Testing model with different URL formats:\n")
for url in test_urls:
    result = analyzer.predict(url)
    print(f'{url:50} -> Risk: {result["risk_score"]:3}% ({result["status"]})')
