#!/usr/bin/env python
"""
Complete extension workflow test: login → register device → check URL
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

User = get_user_model()

# Create or get test user
try:
    user = User.objects.get(username='extuser')
    print(f"Using existing user: {user.username}")
except User.DoesNotExist:
    user = User.objects.create_user(
        username='extuser',
        email='extuser@example.com',
        password='pass123'
    )
    print(f"Created new user: {user.username}")

client = APIClient()

print("\n" + "="*60)
print("STEP 1: LOGIN - Get JWT Token")
print("="*60)

response = client.post('/api/auth/login/', {
    'username': 'extuser',
    'password': 'pass123'
}, format='json')

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    access_token = data.get('access')
    print(f"✓ Got access token: {access_token[:20]}...")
else:
    print(f"ERROR: {response.json()}")
    sys.exit(1)

print("\n" + "="*60)
print("STEP 2: REGISTER DEVICE")
print("="*60)

# Clear old devices if any
from app.models import Device
Device.objects.filter(user=user).delete()

client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

response = client.post('/api/devices/register/', {
    'name': 'Chrome Extension Test',
    'device_type': 'browser',
    'device_fingerprint': 'test-fingerprint-123'
}, format='json')

print(f"Status: {response.status_code}")
if response.status_code == 201:
    data = response.json()
    device_id = data.get('device_id')
    print(f"✓ Device registered: {device_id}")
else:
    print(f"ERROR: {response.json()}")
    sys.exit(1)

print("\n" + "="*60)
print("STEP 3: CHECK URL - Using registered device")
print("="*60)

test_urls = [
    'https://example.com',
    'https://malicious.fake',
]

for test_url in test_urls:
    print(f"\nChecking: {test_url}")
    response = client.post('/api/check-url/', {
        'url': test_url,
        'device_id': device_id
    }, format='json')
    
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"✓ URL: {data.get('url')}")
        print(f"✓ Status: {data.get('status')}")
        print(f"✓ Risk Score: {data.get('risk_score')}%")
        print(f"✓ Threat Type: {data.get('threat_type', 'None')}")
    else:
        print(f"ERROR: {response.json()}")

print("\n" + "="*60)
print("Extension workflow complete!")
print("="*60)
