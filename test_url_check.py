#!/usr/bin/env python
"""
Test script to debug URL checking endpoint
"""
import os
import sys
import django
import requests
import json

# Add sentrax to path
sys.path.insert(0, r'c:\Users\🎮 GAMER 🎮\Desktop\Internet Layer\sentrax')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentrax.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Create test user if needed
try:
    user = User.objects.get(username='testuser')
except User.DoesNotExist:
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    print(f"✓ Created test user: {user.username}")

# Get token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"✓ Generated token: {access_token[:50]}...")

# Test URL check
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("\n" + "="*60)
print("Testing URL Check Endpoint")
print("="*60)

test_urls = [
    'https://example.com',
    'https://google.com',
    'https://phishing-test.com',
]

for test_url in test_urls:
    print(f"\nTesting: {test_url}")
    try:
        response = client.post('/api/check-url/', {
            'url': test_url,
            'device_id': None
        }, format='json')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n" + "="*60)
print("Test Complete")
print("="*60)
