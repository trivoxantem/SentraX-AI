#!/usr/bin/env python
"""
Test script to debug URL checking from extension perspective
"""
import os
import sys
import django
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
    user = User.objects.get(username='testextuser')
except User.DoesNotExist:
    user = User.objects.create_user(
        username='testextuser',
        email='testextuser@example.com',
        password='testpass123'
    )

# Register device
from app.models import Device
device = Device.objects.create(
    user=user,
    name='Test Browser',
    device_type='browser'
)
print(f"Device ID: {device.id}")

# Get token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("\n" + "="*60)
print("Testing URL Check (Extension perspective)")
print("="*60)

test_urls = [
    'https://example.com',
    'https://google.com',
]

for test_url in test_urls:
    print(f"\nTesting: {test_url}")
    try:
        response = client.post('/api/check-url/', {
            'url': test_url,
            'device_id': device.id
        }, format='json')
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ URL: {data.get('url')}")
            print(f"✓ Status: {data.get('status')}")
            print(f"✓ Risk Score: {data.get('risk_score')}%")
        else:
            print(f"ERROR Response: {response.json()}")
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

print("\n" + "="*60)
