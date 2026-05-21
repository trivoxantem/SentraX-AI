#!/usr/bin/env python
"""
Test: Verify parent can block sites and child cannot access them
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
from app.models import Device, BlockRule, Family

User = get_user_model()

print("\n" + "="*70)
print("PARENTAL CONTROL BLOCKING TEST")
print("="*70)

# Cleanup
User.objects.filter(username__in=['parent_user', 'child_user']).delete()

# Create parent
print("\n[1] Creating parent user...")
parent = User.objects.create_user(
    username='parent_user',
    email='parent@example.com',
    password='pass123',
    role='parent'
)
print(f"✓ Parent created: {parent.username} (role: {parent.role})")

# Create child
print("\n[2] Creating child user...")
child = User.objects.create_user(
    username='child_user',
    email='child@example.com',
    password='pass123',
    role='child'
)
print(f"✓ Child created: {child.username} (role: {child.role})")

# Create family relationship
print("\n[3] Creating family and linking child...")
family = Family.objects.create(
    name='Test Family',
    owner=parent
)
child.family = family
child.save()
print(f"✓ Family created: {family.name}")
print(f"✓ Child linked to family")

# Parent adds block rule
print("\n[4] Parent blocks facebook.com...")
block_rule = BlockRule.objects.create(
    user=parent,
    domain='facebook.com',
    is_active=True
)
print(f"✓ Blocked: facebook.com")

# Create devices
print("\n[5] Creating devices...")
parent_device = Device.objects.create(user=parent, name='Parent Device', device_type='browser')
child_device = Device.objects.create(user=child, name='Child Device', device_type='browser')
print(f"✓ Parent device: {parent_device.id}")
print(f"✓ Child device: {child_device.id}")

# Parent login - should NOT be blocked
print("\n[6] Parent checking blocked URL...")
parent_client = APIClient()
response = parent_client.post('/api/auth/login/', {
    'username': 'parent_user',
    'password': 'pass123'
}, format='json')
parent_token = response.json().get('access')
parent_client.credentials(HTTP_AUTHORIZATION=f'Bearer {parent_token}')

response = parent_client.post('/api/check-url/', {
    'url': 'https://facebook.com',
    'device_id': parent_device.id
}, format='json')

data = response.json()
print(f"   URL: {data.get('url')}")
print(f"   Blocked: {data.get('blocked')}")
print(f"   Status: {data.get('status')}")
print(f"   Reason: {data.get('reason')}")

# Child login - SHOULD be blocked
print("\n[7] Child checking SAME blocked URL...")
child_client = APIClient()
response = child_client.post('/api/auth/login/', {
    'username': 'child_user',
    'password': 'pass123'
}, format='json')
child_token = response.json().get('access')
child_client.credentials(HTTP_AUTHORIZATION=f'Bearer {child_token}')

response = child_client.post('/api/check-url/', {
    'url': 'https://facebook.com',
    'device_id': child_device.id
}, format='json')

data = response.json()
print(f"   URL: {data.get('url')}")
print(f"   Blocked: {data.get('blocked')}")
print(f"   Status: {data.get('status')}")
print(f"   Reason: {data.get('reason')}")
print(f"   Is Blocked By Parent: {data.get('is_blocked_by_parent')}")

# Verify
print("\n" + "="*70)
print("RESULTS:")
print("="*70)

if data.get('blocked') == True and data.get('is_blocked_by_parent') == True:
    print("✓ SUCCESS: Child URL is correctly marked as BLOCKED by parent!")
    print(f"  - Status: {data.get('status')}")
    print(f"  - Reason: {data.get('reason')}")
else:
    print("✗ FAILED: Child URL should be blocked but isn't!")
    print(f"  - Blocked: {data.get('blocked')}")
    print(f"  - Is Blocked By Parent: {data.get('is_blocked_by_parent')}")
    print(f"  - Full response: {json.dumps(data, indent=2)}")
