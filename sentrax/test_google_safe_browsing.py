"""
Test script to verify Google Safe Browsing API is working correctly
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentrax.settings')
sys.path.insert(0, '/path/to/sentrax')  # Adjust path as needed
django.setup()

from app.utils.threat_intel import check_google_safe_browsing, check_threat_intel, is_threat_intel_enabled, get_threat_intel_status
from django.conf import settings

print("=" * 60)
print("GOOGLE SAFE BROWSING API TEST")
print("=" * 60)

# Check if threat intelligence is enabled
print("\n1. Checking Threat Intelligence Status...")
print("-" * 60)
status = get_threat_intel_status()
print(f"Threat Intel Enabled: {status['enabled']}")
print(f"Google Safe Browsing: {status['google_safe_browsing']}")
print(f"PhishTank: {status['phishtank']}")

# Check API key configuration
print("\n2. API Key Configuration...")
print("-" * 60)
api_key = getattr(settings, 'GOOGLE_SAFE_BROWSING_API_KEY', None)
if api_key:
    print(f"✓ Google Safe Browsing API Key Configured")
    print(f"  Key (masked): {api_key[:10]}...{api_key[-4:]}")
else:
    print("✗ Google Safe Browsing API Key NOT configured")

# Test with known malicious URL
print("\n3. Testing with Known Malicious URL...")
print("-" * 60)
test_urls = [
    "http://malware.wicar.org/data/java/Exploit.SWF",  # Known malicious
    "https://www.google.com",  # Known safe
    "https://testsafebrowsing.appspot.com/s/malware/",  # Known malicious
]

for test_url in test_urls:
    print(f"\nTesting: {test_url}")
    result = check_google_safe_browsing(test_url)
    print(f"  Malicious: {result['malicious']}")
    print(f"  Threat Types: {result.get('threat_types', [])}")
    if result.get('error'):
        print(f"  Error: {result['error']}")

# Test combined threat intelligence
print("\n4. Testing Combined Threat Intelligence...")
print("-" * 60)
combined_result = check_threat_intel("https://www.google.com")
print(f"Combined Result: {combined_result}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
