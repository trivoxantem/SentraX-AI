#!/usr/bin/env python
"""
Test script to debug family creation endpoint
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
    user = User.objects.get(username='testparent')
    print(f"Using existing user: {user.username} (role: {user.role})")
except User.DoesNotExist:
    user = User.objects.create_user(
        username='testparent',
        email='testparent@example.com',
        password='testpass123',
        role='parent'
    )
    print(f"Created test user: {user.username} (role: {user.role})")

# Get token
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"Generated token")

# Test family creation
client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

print("\n" + "="*60)
print("Testing Family Creation Endpoint")
print("="*60)

print(f"\nTesting with user: {user.username} (role: {user.role})")

try:
    response = client.post('/api/family/create/', {
        'name': 'Test Family'
    }, format='json')
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:")
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
