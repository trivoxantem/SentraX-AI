"""
Unit Tests for URL Threat Detection Analyzer
==============================================

Place this file in: sentrax/app/tests_url_analyzer.py

Run tests with:
    python manage.py test app.tests_url_analyzer
"""

from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from app.models import User as CustomUser, ActivityLog, Threat
from app.utils.url_analyzer import analyze_url, URLAnalyzer


class URLAnalyzerUnitTests(TestCase):
    """Unit tests for URLAnalyzer class"""

    def test_safe_url_analysis(self):
        """Test analysis of a safe, legitimate URL"""
        result = analyze_url('https://www.google.com')
        
        self.assertEqual(result['status'], 'safe')
        self.assertLessEqual(result['risk_score'], 30)
        self.assertTrue(result['analysis']['uses_https'])
        self.assertFalse(result['analysis']['numbers_in_domain'])

    def test_suspicious_url_with_keywords(self):
        """Test URL with suspicious keywords"""
        result = analyze_url('https://login-verify-account.example.com')
        
        self.assertEqual(result['status'], 'suspicious')
        self.assertGreater(result['risk_score'], 30)
        self.assertIn('login', result['analysis']['suspicious_keywords_found'])
        self.assertIn('verify', result['analysis']['suspicious_keywords_found'])

    def test_dangerous_homograph_attack(self):
        """Test homograph attack (numbers mimicking letters)"""
        result = analyze_url('https://faceb00k.com')  # 00 instead of oo
        
        self.assertEqual(result['status'], 'dangerous')
        self.assertGreaterEqual(result['risk_score'], 71)
        self.assertTrue(result['analysis']['numbers_in_domain'])

    def test_dangerous_suspicious_tld(self):
        """Test URL with suspicious TLD"""
        result = analyze_url('https://secure-bank-login.tk')
        
        self.assertEqual(result['status'], 'dangerous')
        self.assertTrue(result['analysis']['suspicious_tld'])

    def test_dangerous_ip_address(self):
        """Test URL using IP address instead of domain"""
        result = analyze_url('http://192.168.1.1:8080/admin/login')
        
        self.assertEqual(result['status'], 'dangerous')
        self.assertTrue(result['analysis']['uses_ip_address'])
        self.assertGreater(result['risk_score'], 70)

    def test_dangerous_encoding_tricks(self):
        """Test URL with encoding tricks"""
        result = analyze_url('https://bank.com%252e%252e/phishing')
        
        self.assertEqual(result['status'], 'dangerous')
        self.assertTrue(result['analysis']['encoding_tricks'])

    def test_no_https_increases_score(self):
        """Test that HTTP-only URLs get higher risk score"""
        safe_http = analyze_url('http://example.com')
        safe_https = analyze_url('https://example.com')
        
        # HTTP version should have higher risk score
        self.assertGreater(safe_http['risk_score'], safe_https['risk_score'])

    def test_long_url_is_suspicious(self):
        """Test that extremely long URLs are flagged"""
        long_url = 'https://www.example.com/' + 'a' * 100
        result = analyze_url(long_url)
        
        self.assertTrue(result['analysis']['url_length_suspicious'])
        self.assertGreater(result['risk_score'], 10)

    def test_multiple_subdomains(self):
        """Test subdomain counting"""
        result = analyze_url('https://sub1.sub2.sub3.example.com')
        
        self.assertGreater(result['analysis']['subdomains'], 1)
        self.assertGreater(result['risk_score'], 10)

    def test_url_with_port_number(self):
        """Test that port numbers don't break IP detection"""
        result = analyze_url('http://192.168.1.1:8080/login')
        
        self.assertTrue(result['analysis']['uses_ip_address'])

    def test_score_capped_at_100(self):
        """Test that risk score never exceeds 100"""
        # URL with many red flags
        dangerous_url = 'http://192.168.1.1/admin%252e%252e/login-bank-verify.tk'
        result = analyze_url(dangerous_url)
        
        self.assertLessEqual(result['risk_score'], 100)

    def test_feature_extraction(self):
        """Test that features are properly extracted"""
        analyzer = URLAnalyzer('https://login-secure-bank.example.com')
        features = analyzer.extract_features()
        
        self.assertIn('url_length', features)
        self.assertIn('subdomain_count', features)
        self.assertIn('suspicious_keywords', features)
        self.assertIn('has_https', features)
        self.assertIn('numbers_in_domain', features)
        self.assertIn('suspicious_tld', features)
        self.assertIn('double_dots', features)
        self.assertIn('ip_address', features)


class CheckURLAPITests(APITestCase):
    """API tests for URL checking endpoint"""

    def setUp(self):
        """Set up test user and authentication"""
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            role='parent'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_check_url_safe(self):
        """Test checking a safe URL via API"""
        response = self.client.post(
            '/api/check-url/',
            {'url': 'https://www.google.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'safe')
        self.assertIn('ai_analysis', data)
        self.assertLessEqual(data['risk_score'], 30)

    def test_check_url_dangerous(self):
        """Test checking a dangerous URL via API"""
        response = self.client.post(
            '/api/check-url/',
            {'url': 'https://l0gin-faceb00k-verify.tk'},
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'dangerous')
        self.assertGreater(data['risk_score'], 70)

    def test_check_url_without_protocol(self):
        """Test that URLs without protocol are auto-completed"""
        response = self.client.post(
            '/api/check-url/',
            {'url': 'example.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['url'].startswith('https://'))

    def test_activity_log_created(self):
        """Test that activity log entry is created"""
        url = 'https://test-url.com'
        self.client.post(
            '/api/check-url/',
            {'url': url},
            format='json'
        )
        
        activity = ActivityLog.objects.filter(user=self.user, url=url).first()
        self.assertIsNotNone(activity)
        self.assertIn(activity.status, ['safe', 'suspicious', 'dangerous'])

    def test_check_url_missing_url_parameter(self):
        """Test error handling for missing URL parameter"""
        response = self.client.post(
            '/api/check-url/',
            {},
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_check_url_requires_authentication(self):
        """Test that endpoint requires authentication"""
        self.client.credentials()  # Remove authentication
        response = self.client.post(
            '/api/check-url/',
            {'url': 'https://example.com'},
            format='json'
        )
        
        self.assertEqual(response.status_code, 401)

    def test_ai_analysis_in_response(self):
        """Test that AI analysis is included in response"""
        response = self.client.post(
            '/api/check-url/',
            {'url': 'https://example.com'},
            format='json'
        )
        
        data = response.json()
        self.assertIn('ai_analysis', data)
        
        ai = data['ai_analysis']
        self.assertIn('risk_score', ai)
        self.assertIn('status', ai)
        self.assertIn('features', ai)
        self.assertIn('analysis', ai)


class ThreatDatabaseIntegrationTests(APITestCase):
    """Tests for integration with Threat database"""

    def setUp(self):
        """Set up test user and threat database entries"""
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        
        self.threat = Threat.objects.create(
            url='https://malicious-site.com',
            threat_type='phishing',
            risk_score=85,
            description='Known phishing site'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_threat_database_match(self):
        """Test that known threats are detected from database"""
        response = self.client.post(
            '/api/check-url/',
            {'url': 'https://malicious-site.com'},
            format='json'
        )
        
        data = response.json()
        self.assertEqual(data['status'], 'dangerous')
        self.assertEqual(data['threat_type'], 'phishing')


# ===========================
# PERFORMANCE TEST
# ===========================

import time

class PerformanceTests(TestCase):
    """Test analyzer performance"""

    def test_analysis_performance(self):
        """Test that URL analysis completes quickly"""
        urls = [
            'https://www.google.com',
            'https://login-verify-bank.tk',
            'http://192.168.1.1:8080/admin',
            'https://example.com' * 10,
        ]
        
        start = time.time()
        for url in urls:
            analyze_url(url)
        elapsed = time.time() - start
        
        avg_time = elapsed / len(urls)
        print(f"Average analysis time: {avg_time*1000:.2f}ms")
        
        # Should complete in under 100ms per URL
        self.assertLess(avg_time, 0.1)


# ===========================
# TEST CASE DATA
# ===========================

TEST_URLS = [
    # (url, expected_status, description)
    ('https://www.google.com', 'safe', 'Major search engine'),
    ('https://www.github.com', 'safe', 'Major code hosting'),
    ('https://example.com', 'safe', 'Simple example domain'),
    
    ('https://verify-account.com', 'suspicious', 'Contains suspicious keyword'),
    ('https://secure-login-verify.example.com', 'suspicious', 'Multiple keywords'),
    ('http://example.com', 'suspicious', 'HTTP instead of HTTPS'),
    
    ('https://l0gin-faceb00k.com', 'dangerous', 'Homograph attack'),
    ('https://bank-verify.tk', 'dangerous', 'Suspicious TLD + keywords'),
    ('http://192.168.1.1:8080', 'dangerous', 'IP address usage'),
    ('https://bank.com%252e%252e/login', 'dangerous', 'Encoding tricks'),
]


if __name__ == '__main__':
    import unittest
    unittest.main()
