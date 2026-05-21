#!/usr/bin/env python3
"""Test Google URL variations consistency."""

from ml.ml_analyzer import get_ml_analyzer

analyzer = get_ml_analyzer()

test_urls = [
    'https://google.com',
    'https://www.google.com',
    'http://google.com',
    'google.com',
]

print("Google.com Variations - Should All Be Identical:\n")
for url in test_urls:
    result = analyzer.predict(url)
    print(f'{url:30} -> {result["risk_score"]:3}% ({result["status"]})')
