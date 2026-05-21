#!/usr/bin/env python
"""
End-to-end test: Parent blocks URL, child tries to access, verify blocking works
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
from app.models import Device, BlockRule, Family

User = get_user_model()

print("\n" + "="*70)
print("END-TO-END BLOCKING TEST")
print("="*70)

# Cleanup
User.objects.filter(username__in=['parent_e2e', 'child_e2e']).delete()

# Setup
print("\n[SETUP] Creating test accounts...")
parent = User.objects.create_user(
    username='parent_e2e',
    email='parent@e2e.com',
    password='pass123',
    role='parent'
)
child = User.objects.create_user(
    username='child_e2e',
    email='child@e2e.com',
    password='pass123',
    role='child'
)

family = Family.objects.create(name='E2E Family', owner=parent)
child.family = family
child.save()

# Parent blocks multiple sites
print("\n[PARENT] Blocking sites...")
blocked_sites = ['facebook.com', 'instagram.com', 'youtube.com']
for site in blocked_sites:
    BlockRule.objects.create(user=parent, domain=site, is_active=True)
    print(f"   ✓ Blocked: {site}")

# Create devices
parent_device = Device.objects.create(user=parent, name='Parent', device_type='browser')
child_device = Device.objects.create(user=child, name='Child', device_type='browser')

# Test URLs
test_urls = [
    ('https://facebook.com', True, 'blocked_by_parent'),
    ('https://instagram.com', True, 'blocked_by_parent'),
    ('https://youtube.com', True, 'blocked_by_parent'),
    ('https://google.com', False, 'safe'),
    ('https://github.com', False, 'safe'),
]

# Login as child
print("\n[CHILD] Logging in...")
child_client = APIClient()
response = child_client.post('/api/auth/login/', {
    'username': 'child_e2e',
    'password': 'pass123'
}, format='json')

child_token = response.json().get('access')
child_client.credentials(HTTP_AUTHORIZATION=f'Bearer {child_token}')
print(f"   ✓ Logged in")

# Test each URL
print("\n[CHILD] Testing URL access:")
print("=" * 70)

blocked_count = 0
allowed_count = 0

for url, should_be_blocked, expected_type in test_urls:
    response = child_client.post('/api/check-url/', {
        'url': url,
        'device_id': child_device.id
    }, format='json')
    
    data = response.json()
    is_blocked = data.get('blocked', False)
    is_blocked_by_parent = data.get('is_blocked_by_parent', False)
    status = data.get('status')
    
    # Check result
    if should_be_blocked:
        if is_blocked and is_blocked_by_parent:
            result = "✓ BLOCKED"
            blocked_count += 1
        else:
            result = "✗ NOT BLOCKED (ERROR!)"
    else:
        if not is_blocked:
            result = "✓ ALLOWED"
            allowed_count += 1
        else:
            result = "✗ BLOCKED (ERROR!)"
    
    print(f"\n{url}")
    print(f"   Expected: {'BLOCKED' if should_be_blocked else 'ALLOWED'}")
    print(f"   Actual:   {result}")
    print(f"   Status:   {status}")
    print(f"   Reason:   {data.get('reason', 'N/A')}")

# Results
print("\n" + "="*70)
print("RESULTS:")
print("="*70)

total_blocked = len([u for u in test_urls if u[1] == True])
total_allowed = len([u for u in test_urls if u[1] == False])

print(f"Blocked URLs: {blocked_count}/{total_blocked} working correctly")
print(f"Allowed URLs: {allowed_count}/{total_allowed} working correctly")

if blocked_count == total_blocked and allowed_count == total_allowed:
    print("\n✓ SUCCESS: All blocking rules working correctly!")
    print("\nThe child's extension will see:")
    for url, should_block, _ in test_urls:
        if should_block:
            print(f"  • {url} → Redirects to blocked.html")
else:
    print("\n✗ FAILED: Some URLs are not being blocked correctly!")
