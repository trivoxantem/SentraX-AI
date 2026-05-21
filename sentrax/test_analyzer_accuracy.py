#!/usr/bin/env python
"""
Quick test script to verify URL analyzer accuracy
Run with: python manage.py shell < test_analyzer.py
"""

from app.utils.url_analyzer import analyze_url

# Test cases with expected results
test_cases = [
    # (url, expected_status, description)
    ('https://www.google.com', 'safe', 'Google - Major search engine'),
    ('https://www.github.com', 'safe', 'GitHub - Major code platform'),
    ('https://example.com', 'safe', 'Example domain'),
    
    ('https://verify-account.example.com', 'suspicious', 'Contains verify keyword'),
    ('http://example.com', 'suspicious', 'HTTP instead of HTTPS'),
    ('https://bank-login-secure.example.com', 'suspicious', 'Multiple keywords'),
    
    ('https://l0gin-faceb00k.com', 'dangerous', 'Homograph attack (numbers)'),
    ('https://bank-verify.tk', 'dangerous', 'Suspicious TLD + keywords'),
    ('http://192.168.1.1:8080/admin', 'dangerous', 'IP address'),
]

print("\n" + "="*70)
print("URL ANALYZER TEST SUITE - REFINED SCORING (v1.1)")
print("="*70 + "\n")

passed = 0
failed = 0

for url, expected_status, description in test_cases:
    result = analyze_url(url)
    status_match = result['status'] == expected_status
    
    status_str = '✓ PASS' if status_match else '✗ FAIL'
    passed += 1 if status_match else 0
    failed += 0 if status_match else 1
    
    print(f"{status_str}: {description}")
    print(f"  URL: {url}")
    print(f"  Expected: {expected_status}, Got: {result['status']}")
    print(f"  Risk Score: {result['risk_score']}/100")
    
    if result['analysis']['suspicious_keywords_found']:
        print(f"  Keywords: {', '.join(result['analysis']['suspicious_keywords_found'])}")
    
    print()

print("="*70)
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
print("="*70 + "\n")

# Show detailed analysis for a specific URL
print("DETAILED ANALYSIS EXAMPLE:")
print("-"*70)
url = 'https://verify-bank-login.com'
result = analyze_url(url)
print(f"URL: {url}")
print(f"Status: {result['status']}")
print(f"Risk Score: {result['risk_score']}/100")
print(f"\nFeature Breakdown:")
print(f"  URL Length Suspicious: {result['analysis']['url_length_suspicious']}")
print(f"  Uses HTTPS: {result['analysis']['uses_https']}")
print(f"  Subdomains: {result['analysis']['subdomains']}")
print(f"  Numbers in Domain: {result['analysis']['numbers_in_domain']}")
print(f"  Suspicious TLD: {result['analysis']['suspicious_tld']}")
print(f"  URL Encoding Tricks: {result['analysis']['encoding_tricks']}")
print(f"  Uses IP Address: {result['analysis']['uses_ip_address']}")
print(f"  Suspicious Keywords: {result['analysis']['suspicious_keywords_found']}")
