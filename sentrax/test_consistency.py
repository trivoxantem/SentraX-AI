#!/usr/bin/env python3
"""Test user-reported URLs."""

from ml.ml_analyzer import get_ml_analyzer

analyzer = get_ml_analyzer()

test_cases = [
    ('https://instagram.com/', 'Instagram no www'),
    ('https://www.instagram.com/', 'Instagram with www'),
    ('www.apple.com', 'Apple without protocol'),
    ('https://www.apple.com', 'Apple with https and www'),
    ('https://samsung.com', 'Samsung without www'),
    ('https://www.samsung.com', 'Samsung with www'),
]

print("Consistency Check - Same Sites Should Have Similar Scores:\n")
for url, label in test_cases:
    result = analyzer.predict(url)
    print(f'{url:40} [{label:30}] -> {result["risk_score"]:3}% ({result["status"]})')
