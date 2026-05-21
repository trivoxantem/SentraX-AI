#!/usr/bin/env python
"""
Debug test to see exact API response status
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

User = get_user_model()

# Create or get test user
user = User.objects.create_user(
    username='statustest',
    email='statustest@example.com',
    password='pass123'
)

# Get token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

# Register device
from app.models import Device
device = Device.objects.create(user=user, name='Test', device_type='browser')

print("\n" + "="*60)
print("Testing URL Check - Full Response")
print("="*60)

response = client.post('/api/check-url/', {
    'url': 'https://example.com',
    'device_id': device.id
}, format='json')

data = response.json()

print(f"\nStatus Code: {response.status_code}")
print(f"\nFull Response:")
print(json.dumps(data, indent=2))

# Check status value
status_value = data.get('status')
print(f"\nStatus Value: '{status_value}'")
print(f"Status Type: {type(status_value)}")
print(f"Status is Valid: {status_value in ['safe', 'suspicious', 'dangerous']}")
