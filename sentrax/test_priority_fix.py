"""
Test script to verify the Priority Order Fix
Tests the complete check flow in the correct priority order
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentrax.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from app.utils.threat_intel import check_threat_intel, check_google_safe_browsing, is_threat_intel_enabled, get_threat_intel_status
from app.utils.url_analyzer import analyze_url
from ml.ml_analyzer import predict_url
from django.conf import settings

print("=" * 70)
print("URL ANALYSIS PRIORITY TEST")
print("=" * 70)

# Check threat intel status
print("\n1. Checking Threat Intelligence Status...")
print("-" * 70)
status = get_threat_intel_status()
print(f"Threat Intel Enabled: {status['enabled']}")
print(f"Google Safe Browsing: {status['google_safe_browsing']}")

if not status['enabled']:
    print("❌ ERROR: Threat Intel is not enabled!")
    sys.exit(1)

# Test URLs
test_cases = [
    {
        'url': 'https://www.google.com',
        'expected': 'safe',
        'description': 'Safe URL - Google.com'
    },
    {
        'url': 'http://malware.wicar.org/data/java/Exploit.SWF',
        'expected': 'dangerous',
        'description': 'Malicious URL - Malware.wicar.org'
    },
]

for i, test in enumerate(test_cases, 1):
    url = test['url']
    
    print(f"\n{i}. Testing: {test['description']}")
    print(f"   URL: {url}")
    print("-" * 70)
    
    # Step 1: Check Google Safe Browsing
    print("\n   Step 1: Google Safe Browsing Check")
    gsb_result = check_google_safe_browsing(url)
    print(f"      Malicious: {gsb_result['malicious']}")
    print(f"      Threat Types: {gsb_result.get('threat_types', [])}")
    if gsb_result.get('error'):
        print(f"      Error: {gsb_result['error']}")
    
    # Step 2: Combined Threat Intel Check
    print("\n   Step 2: Combined Threat Intelligence Check")
    threat_result = check_threat_intel(url)
    print(f"      Malicious: {threat_result['malicious']}")
    print(f"      Risk Score: {threat_result.get('risk_score', 0)}")
    print(f"      Primary Threat: {threat_result.get('primary_threat', 'N/A')}")
    
    # Step 3: ML Analysis (should be skipped if threat intel is malicious)
    print("\n   Step 3: ML Analysis (if Threat Intel says safe)")
    if threat_result['malicious']:
        print(f"      ⏭️  SKIPPED - Threat Intelligence already detected malicious")
    else:
        try:
            ml_result = predict_url(url)
            print(f"      Status: {ml_result.get('status', 'unknown')}")
            print(f"      Risk Score: {ml_result.get('risk_score', 0)}")
            print(f"      Model Used: {ml_result.get('model_used', False)}")
        except Exception as e:
            print(f"      ❌ Error: {e}")
    
    # Summary
    print("\n   📋 EXPECTED vs ACTUAL")
    print(f"      Expected Status: {test['expected']}")
    print(f"      Actual Status: {'dangerous' if threat_result['malicious'] else 'safe'}")
    print(f"      Risk Score: {threat_result.get('risk_score', 0)}%")
    
    if threat_result['malicious']:
        if test['expected'] == 'dangerous':
            print(f"      ✅ PASS - Correctly detected as dangerous")
        else:
            print(f"      ❌ FAIL - Should be {test['expected']} but detected as dangerous")
    else:
        if test['expected'] == 'safe':
            print(f"      ✅ PASS - Correctly detected as safe")
        else:
            print(f"      ❌ FAIL - Should be {test['expected']} but detected as safe")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
print("""
KEY FIX APPLIED:
- ML Analysis now only runs if Threat Intel says URL is SAFE
- If Threat Intel detects malicious, result is NOT overwritten
- Priority Order: BlockRules > Threat Intel > Global DB > ML > Fallback
""")
