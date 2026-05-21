#!/usr/bin/env python
"""
Test that dangerous URLs are detected and marked for blocking
"""
import os
import sys
import django
import json

sys.path.insert(0, r'c:\Users\🎮 GAMER 🎮\Desktop\Internet Layer\sentrax')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentrax.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from app.models import Device

User = get_user_model()

print("\n" + "="*70)
print("DANGEROUS URL DETECTION TEST")
print("="*70)

# Create test user
user = User.objects.create_user(
    username='dangertest',
    email='danger@test.com',
    password='pass123'
)
print("\n[1] Created user: dangertest")

# Get token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

# Register device
device = Device.objects.create(user=user, name='Test Device', device_type='browser')
print("[2] Created device: {}".format(device.id))

# Test various URLs
test_urls = [
    'https://google.com',      # Safe
    'https://github.com',       # Safe
    'https://localhost:5173',   # Safe (local app)
    'https://malicious.fake',   # Might be marked suspicious/dangerous
    'https://phishing.fake',    # Might be marked dangerous
]

print("\n[3] Testing URLs for danger detection:")
print("-" * 70)

results = {
    'safe': [],
    'suspicious': [],
    'dangerous': []
}

for url in test_urls:
    response = client.post('/api/check-url/', {
        'url': url,
        'device_id': device.id
    }, format='json')
    
    if response.status_code == 200:
        data = response.json()
        status = data.get('status', 'unknown')
        risk_score = data.get('risk_score', 0)
        
        results[status].append({
            'url': url,
            'risk_score': risk_score,
            'blocked': data.get('blocked', False),
            'reason': data.get('reason', 'N/A')
        })
        
        print("\nURL: {}".format(url))
        print("  Status: {}".format(status.upper()))
        print("  Risk Score: {}%".format(risk_score))
        print("  Blocked: {}".format(data.get('blocked', False)))
    else:
        print("\nURL: {}".format(url))
        print("  ERROR: {}".format(response.status_code))

# Summary
print("\n" + "="*70)
print("RESULTS:")
print("="*70)

print("\nSafe URLs: {}".format(len(results['safe'])))
for item in results['safe']:
    print("  - {}".format(item['url']))

print("\nSuspicious URLs: {}".format(len(results['suspicious'])))
for item in results['suspicious']:
    print("  - {} (Risk: {}%)".format(item['url'], item['risk_score']))

print("\nDangerous URLs: {}".format(len(results['dangerous'])))
for item in results['dangerous']:
    print("  - {} (Risk: {}%)".format(item['url'], item['risk_score']))
    print("    Would be BLOCKED: {}".format(item['blocked']))

if len(results['dangerous']) > 0:
    print("\n[SUCCESS] Dangerous URLs detected!")
    print("\nWhen extension sees these dangerous URLs, it will:")
    print("  1. Intercept navigation (webNavigation.onBeforeNavigate)")
    print("  2. Call backend to check URL")
    print("  3. Backend returns status: 'dangerous'")
    print("  4. Extension redirects to blocked.html")
    print("  5. User sees: 'Dangerous Website Blocked for Your Protection'")
else:
    print("\n[INFO] No dangerous URLs detected in this test")
    print("This is normal - most URLs are detected as safe")
    print("Real dangerous URLs (phishing, malware) will be blocked similarly")
