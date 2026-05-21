#!/usr/bin/env python
"""
Test to simulate frontend behavior and verify device list API
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
print("FRONTEND-LIKE DEVICE TEST")
print("="*70)

# Cleanup and create user
username = 'frontendtest'
User.objects.filter(username=username).delete()

user = User.objects.create_user(
    username=username,
    email='frontendtest@example.com',
    password='pass123'
)
print(f"\n[1] Created user: {username}")

# Create multiple devices BEFORE logging in
print("\n[2] Creating devices before login...")
Device.objects.filter(user=user).delete()

for i in range(3):
    device = Device.objects.create(
        user=user,
        name=f'Browser {i+1}',
        device_type='browser'
    )
    print(f"   ✓ Device {i+1}: {device.id}")

# Simulate frontend login
print("\n[3] Simulating frontend login...")
client = APIClient()

response = client.post('/api/auth/login/', {
    'username': username,
    'password': 'pass123'
}, format='json')

print(f"   Status: {response.status_code}")
if response.status_code != 200:
    print(f"   ERROR: {response.json()}")
    sys.exit(1)

tokens = response.json()
access_token = tokens.get('access')
print(f"   ✓ Got access token: {access_token[:30]}...")

# Simulate frontend setting auth header
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

# Simulate frontend API call to get devices
print("\n[4] Frontend calls GET /api/devices/...")
response = client.get('/api/devices/', format='json')

print(f"   Status: {response.status_code}")

if response.status_code != 200:
    print(f"   ERROR: {response.json()}")
    sys.exit(1)

data = response.json()
print(f"\n[5] API Response:")
print(json.dumps(data, indent=2, default=str))

devices = data.get('devices', [])
print(f"\n[6] RESULTS:")
print(f"   Expected: 3 devices")
print(f"   Actual: {len(devices)} devices")

if len(devices) == 0:
    print(f"   ✗ FAILED: No devices returned!")
    print(f"\n   Full response data:")
    print(json.dumps(data, indent=2, default=str))
    
    # Debug database
    print(f"\n   Database check:")
    db_devices = Device.objects.filter(user=user)
    print(f"   Devices in DB for this user: {db_devices.count()}")
    for dev in db_devices:
        print(f"     - ID: {dev.id}, Name: {dev.name}, User: {dev.user.username}")
    
    sys.exit(1)

print(f"   ✓ SUCCESS: Devices found!")
for i, dev in enumerate(devices, 1):
    print(f"   Device {i}: ID={dev['id']}, Name={dev['name']}")

# Test multiple calls
print("\n[7] Testing multiple API calls (to verify consistency)...")
for call in range(1, 4):
    response = client.get('/api/devices/', format='json')
    count = len(response.json().get('devices', []))
    print(f"   Call {call}: {count} devices")
    if count != 3:
        print(f"   ✗ INCONSISTENT!")
        sys.exit(1)

print(f"   ✓ Consistent across calls")

print("\n" + "="*70)
print("✓ ALL TESTS PASSED!")
print("="*70)
