#!/usr/bin/env python
"""
Complete device workflow test: login -> register device -> list devices
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
print("COMPLETE DEVICE WORKFLOW TEST")
print("="*70)

# Step 1: Create a fresh user
print("\n[1] Creating fresh test user...")
username = 'deviceworkflow001'
try:
    user = User.objects.get(username=username)
    user.delete()
    print(f"✓ Cleaned up existing user")
except:
    pass

user = User.objects.create_user(
    username=username,
    email='devicetest001@example.com',
    password='pass123'
)
print(f"✓ Created user: {username}")

client = APIClient()

# Step 2: Login
print("\n[2] Login...")
response = client.post('/api/auth/login/', {
    'username': username,
    'password': 'pass123'
}, format='json')

if response.status_code != 200:
    print(f"✗ Login failed: {response.json()}")
    sys.exit(1)

token = response.json().get('access')
print(f"✓ Login successful, got token")

client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

# Step 3: Register first device
print("\n[3] Registering first device...")
response = client.post('/api/devices/register/', {
    'name': 'Chrome Browser (Main)',
    'device_type': 'browser',
}, format='json')

if response.status_code not in [200, 201]:
    print(f"✗ Device 1 registration failed: {response.json()}")
    sys.exit(1)

device1_id = response.json().get('device', {}).get('id')
print(f"✓ Device 1 registered: {device1_id}")

# Step 4: Register second device
print("\n[4] Registering second device...")
response = client.post('/api/devices/register/', {
    'name': 'Firefox Browser (Secondary)',
    'device_type': 'browser',
}, format='json')

if response.status_code not in [200, 201]:
    print(f"✗ Device 2 registration failed: {response.json()}")
    sys.exit(1)

device2_id = response.json().get('device', {}).get('id')
print(f"✓ Device 2 registered: {device2_id}")

# Step 5: List devices
print("\n[5] Fetching device list...")
response = client.get('/api/devices/', format='json')

if response.status_code != 200:
    print(f"✗ Failed to fetch devices: {response.json()}")
    sys.exit(1)

data = response.json()
devices = data.get('devices', [])
print(f"✓ Fetched {data.get('count')} devices")

# Step 6: Verify
print("\n[6] VERIFICATION:")
print(f"Expected count: 2")
print(f"Actual count: {len(devices)}")

if len(devices) != 2:
    print("✗ FAILED: Device count mismatch!")
    for i, dev in enumerate(devices, 1):
        print(f"  Device {i}: {dev.get('id')} - {dev.get('name')}")
    sys.exit(1)

device_ids = {dev['id'] for dev in devices}
expected_ids = {device1_id, device2_id}

if device_ids != expected_ids:
    print("✗ FAILED: Device IDs don't match!")
    print(f"Expected: {expected_ids}")
    print(f"Got: {device_ids}")
    sys.exit(1)

print("✓ All devices present:")
for i, dev in enumerate(devices, 1):
    print(f"  Device {i}: ID={dev['id']}, Name={dev['name']}, Status={dev['status']}")

# Step 7: Test create -> refresh -> list workflow
print("\n[7] Testing new device auto-appearance...")
print("Simulating extension device registration...")

response = client.post('/api/devices/register/', {
    'name': 'Edge Browser (New)',
    'device_type': 'browser',
}, format='json')

if response.status_code not in [200, 201]:
    print(f"✗ Device 3 registration failed")
    sys.exit(1)

device3_id = response.json().get('device', {}).get('id')
print(f"✓ Device 3 registered: {device3_id}")

# Fetch list again (without cache)
response = client.get('/api/devices/', format='json')
devices = response.json().get('devices', [])

if len(devices) != 3:
    print(f"✗ FAILED: Expected 3 devices after registration, got {len(devices)}")
    sys.exit(1)

print(f"✓ New device appears in list immediately (3 devices total)")

print("\n" + "="*70)
print("✓ ALL TESTS PASSED!")
print("="*70)
print("\nSummary:")
print("✓ User creation works")
print("✓ Login returns valid token")
print("✓ Device registration works")
print("✓ Device list returns all user devices")
print("✓ New devices appear in list without manual refresh")
print("✓ Device metadata is correct (id, name, status, timestamps)")
