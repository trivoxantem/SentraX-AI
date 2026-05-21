#!/usr/bin/env python
"""
Test exact scenario: Login in browser 1, login in browser 2, check devices in browser 1
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
from app.models import Device

User = get_user_model()

print("\n" + "="*70)
print("EXACT SCENARIO TEST: Multiple Browser Logins")
print("="*70)

# Cleanup and create user
username = 'multibroswer'
User.objects.filter(username=username).delete()

user = User.objects.create_user(
    username=username,
    email='multibrowser@example.com',
    password='pass123'
)
print(f"\n[SETUP] Created user: {username}")

# Clean old devices
Device.objects.filter(user=user).delete()

# BROWSER 1: Login and get token
print("\n[BROWSER 1] Logging in...")
client1 = APIClient()
response = client1.post('/api/auth/login/', {
    'username': username,
    'password': 'pass123'
}, format='json')

token1 = response.json().get('access')
client1.credentials(HTTP_AUTHORIZATION=f'Bearer {token1}')
print(f"   ✓ Got token: {token1[:20]}...")

# BROWSER 1: Register first device
print("\n[BROWSER 1] Registering device...")
response = client1.post('/api/devices/register/', {
    'name': 'Browser 1 - Chrome',
    'device_type': 'browser',
}, format='json')

device1_id = response.json().get('device', {}).get('id')
print(f"   ✓ Registered device: {device1_id}")

# Check devices in browser 1
print("\n[BROWSER 1] Checking devices list...")
response = client1.get('/api/devices/', format='json')
browser1_devices = response.json().get('devices', [])
print(f"   Found {len(browser1_devices)} device(s)")
for dev in browser1_devices:
    print(f"     - {dev['id']}: {dev['name']}")

# BROWSER 2: Login with SAME user
print("\n[BROWSER 2] Logging in (same user)...")
client2 = APIClient()
response = client2.post('/api/auth/login/', {
    'username': username,
    'password': 'pass123'
}, format='json')

token2 = response.json().get('access')
client2.credentials(HTTP_AUTHORIZATION=f'Bearer {token2}')
print(f"   ✓ Got token: {token2[:20]}...")

# BROWSER 2: Register second device
print("\n[BROWSER 2] Registering device...")
response = client2.post('/api/devices/register/', {
    'name': 'Browser 2 - Firefox',
    'device_type': 'browser',
}, format='json')

device2_id = response.json().get('device', {}).get('id')
print(f"   ✓ Registered device: {device2_id}")

# Check devices in browser 2
print("\n[BROWSER 2] Checking devices list...")
response = client2.get('/api/devices/', format='json')
browser2_devices = response.json().get('devices', [])
print(f"   Found {len(browser2_devices)} device(s)")
for dev in browser2_devices:
    print(f"     - {dev['id']}: {dev['name']}")

# Back to BROWSER 1: Check if new device appears
print("\n[BROWSER 1] Checking devices list again (should see both now)...")
response = client1.get('/api/devices/', format='json')
browser1_devices_updated = response.json().get('devices', [])
print(f"   Found {len(browser1_devices_updated)} device(s)")
for dev in browser1_devices_updated:
    print(f"     - {dev['id']}: {dev['name']}")

# Verify
print("\n" + "="*70)
print("RESULTS:")
print("="*70)

before_count = len(browser1_devices)
after_count = len(browser1_devices_updated)

print(f"Devices in Browser 1 BEFORE Browser 2 login: {before_count}")
print(f"Devices in Browser 1 AFTER Browser 2 login:  {after_count}")
print(f"New devices appeared: {after_count - before_count}")

if after_count == 2:
    print(f"\n✓ SUCCESS: New device appears in Browser 1 after Browser 2 login!")
else:
    print(f"\n✗ FAILED: Browser 2 device not showing in Browser 1!")
    print(f"Expected 2 devices, got {after_count}")
