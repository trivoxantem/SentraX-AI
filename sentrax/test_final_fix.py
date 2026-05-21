"""
Quick Verification Test - Final Fix Check
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentrax.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from app.utils.threat_intel import check_threat_intel

print("=" * 70)
print("QUICK VERIFICATION TEST - Final Fix")
print("=" * 70)

# Test Case 1: Safe URL
print("\n1. Testing SAFE URL: https://www.google.com")
print("-" * 70)
result1 = check_threat_intel("https://www.google.com")
print(f"Threat Intel Result:")
print(f"  Malicious: {result1['malicious']}")
print(f"  Risk Score: {result1.get('risk_score', 0)}%")
print(f"  Expected: Malicious=False, Risk=0%")
if not result1['malicious'] and result1.get('risk_score', 0) == 0:
    print("  ✅ PASS - Threat Intel says SAFE")
else:
    print("  ❌ FAIL")

# Test Case 2: Malicious URL
print("\n2. Testing MALICIOUS URL: http://malware.wicar.org/data/java/Exploit.SWF")
print("-" * 70)
result2 = check_threat_intel("http://malware.wicar.org/data/java/Exploit.SWF")
print(f"Threat Intel Result:")
print(f"  Malicious: {result2['malicious']}")
print(f"  Risk Score: {result2.get('risk_score', 0)}%")
print(f"  Primary Threat: {result2.get('primary_threat', 'N/A')}")
print(f"  Expected: Malicious=True, Risk=95%")
if result2['malicious'] and result2.get('risk_score', 0) >= 90:
    print("  ✅ PASS - Threat Intel says MALICIOUS")
else:
    print("  ❌ FAIL")

print("\n" + "=" * 70)
print("EXPECTED BEHAVIOR AFTER FIX:")
print("=" * 70)
print("""
google.com:
  - Threat Intel says: Safe (0%)
  - ML Analysis: SKIPPED (not run)
  - Frontend shows: 0% risk, Safe status
  
malware.wicar.org:
  - Threat Intel says: Malicious (95%)
  - ML Analysis: SKIPPED (not run)  
  - Frontend shows: 95% risk, Dangerous status
  
NO CONFUSING ML CONFIDENCE SCORES!
""")
