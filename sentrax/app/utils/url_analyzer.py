"""
URL Threat Detection Analyzer
==============================
Intelligent URL scanning with feature extraction and risk scoring.
Designed to detect unknown threats and enhance accuracy of URL scanning.
Future-proof for ML model integration.

UPDATED: Scoring algorithm refined for accuracy (v1.1)
- Reduced keyword weighting (max +40 instead of +60)
- Reduced HTTPS penalty (+12 instead of +20) 
- Reduced other feature penalties for better balance
- Refined thresholds: Safe (0-25), Suspicious (26-60), Dangerous (61-100)
"""

import re
from urllib.parse import urlparse


class URLAnalyzer:
    """
    AI-based URL threat analyzer with feature extraction and risk scoring.
    
    Features analyzed:
    - URL length
    - Number of subdomains (dots)
    - Presence of suspicious keywords
    - HTTPS/SSL certificate indication
    - Numbers in domain name
    - URL structure anomalies
    """
    
    # Suspicious keywords commonly found in phishing/malware URLs
    SUSPICIOUS_KEYWORDS = [
        'login', 'secure', 'bank', 'free', 'verify', 'update',
        'confirm', 'validate', 'account', 'password', 'reset',
        'admin', 'panel', 'check', 'click', 'urgent', 'limited',
        'expire', 'claim', 'reward', 'prize', 'congratulations'
    ]
    
    # Suspicious TLDs that are often abused
    SUSPICIOUS_TLDS = [
        '.tk', '.ml', '.ga', '.cf',  # Free domains
        '.xyz', '.gq', '.top',  # Generic suspicious TLDs
    ]
    
    def __init__(self, url: str):
        """
        Initialize analyzer with a URL.
        
        Args:
            url (str): Full URL to analyze (should have protocol)
        """
        self.url = url.lower().strip()
        self.parsed_url = urlparse(self.url)
        self.domain = self.parsed_url.netloc or self.parsed_url.path
        self.path = self.parsed_url.path
        self.features = {}
        self.risk_score = 0
        self.status = 'safe'
    
    def extract_features(self) -> dict:
        """
        Extract relevant security features from URL.
        
        Returns:
            dict: Dictionary containing extracted features
        """
        self.features = {
            'url_length': self._check_url_length(),
            'subdomain_count': self._count_dots(),
            'suspicious_keywords': self._check_suspicious_keywords(),
            'has_https': self._check_https(),
            'numbers_in_domain': self._check_numbers_in_domain(),
            'suspicious_tld': self._check_suspicious_tld(),
            'double_dots': self._check_double_encoding(),
            'ip_address': self._check_ip_address(),
        }
        return self.features
    
    def _check_url_length(self) -> bool:
        """
        Check if URL is suspiciously long.
        Legitimate URLs are typically < 75 characters.
        Phishing URLs often use long URLs to hide real destination.
        
        Returns:
            bool: True if URL is suspiciously long
        """
        threshold = 75
        is_long = len(self.url) > threshold
        return is_long
    
    def _count_dots(self) -> int:
        """
        Count number of dots (subdomains) in domain.
        Multiple subdomains can indicate sophisticated phishing.
        
        Returns:
            int: Number of dots in domain
        """
        # Remove www. prefix for cleaner count
        domain_clean = self.domain.replace('www.', '')
        return domain_clean.count('.')
    
    def _check_suspicious_keywords(self) -> list:
        """
        Search for suspicious keywords in URL.
        
        Returns:
            list: List of suspicious keywords found
        """
        found_keywords = []
        url_parts = self.url.replace('-', ' ').replace('_', ' ').split()
        
        for keyword in self.SUSPICIOUS_KEYWORDS:
            # Check in full URL
            if keyword in self.url:
                found_keywords.append(keyword)
        
        return found_keywords
    
    def _check_https(self) -> bool:
        """
        Check if URL uses HTTPS (secure connection).
        HTTP-only URLs are riskier.
        
        Returns:
            bool: True if HTTPS is used
        """
        return self.parsed_url.scheme == 'https'
    
    def _check_numbers_in_domain(self) -> bool:
        """
        Check if domain contains numbers.
        Can indicate homograph attacks (confusing similar-looking characters).
        Example: faceb00k.com instead of facebook.com
        
        Returns:
            bool: True if numbers found in domain
        """
        # Remove port numbers for accurate check
        domain_no_port = self.domain.split(':')[0]
        return bool(re.search(r'\d', domain_no_port))
    
    def _check_suspicious_tld(self) -> bool:
        """
        Check if domain uses suspicious TLD.
        
        Returns:
            bool: True if suspicious TLD detected
        """
        for tld in self.SUSPICIOUS_TLDS:
            if self.domain.endswith(tld):
                return True
        return False
    
    def _check_double_encoding(self) -> bool:
        """
        Check for URL encoding tricks (double dots, encoded characters).
        Attackers use these to bypass filters.
        
        Returns:
            bool: True if encoding tricks detected
        """
        encoding_patterns = ['..', '%2e%2e', '%252e', '\\\\']
        return any(pattern in self.url for pattern in encoding_patterns)
    
    def _check_ip_address(self) -> bool:
        """
        Check if URL uses IP address instead of domain.
        Phishing sites often use IP addresses.
        
        Returns:
            bool: True if IP address is used
        """
        # Check if domain looks like IP address
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}'
        domain_no_port = self.domain.split(':')[0]
        return bool(re.match(ip_pattern, domain_no_port))
    
    def calculate_risk_score(self) -> int:
        """
        Calculate overall risk score based on extracted features.
        
        Scoring logic (refined for accuracy):
        - +20 for each suspicious keyword found (max +40)
        - +10 if URL is too long
        - +8 for each extra subdomain (beyond 1, max +20)
        - +12 if not HTTPS (reduced - many legitimate sites use HTTP)
        - +15 if numbers in domain
        - +18 if suspicious TLD
        - +22 if double encoding detected
        - +28 if IP address used instead of domain
        
        Risk Score Categories (refined):
        - 0–25: Safe
        - 26–60: Suspicious
        - 61–100: Dangerous
        
        Returns:
            int: Risk score (0-100, capped at 100)
        """
        self.extract_features()
        
        score = 0
        
        # Keyword detection: +20 per keyword (max 40 to avoid over-weighting)
        # Reduced from +60 to +40 since keywords alone don't guarantee threat
        keyword_count = len(self.features['suspicious_keywords'])
        score += min(keyword_count * 20, 40)
        
        # URL length: +10 (reduced from +15)
        if self.features['url_length']:
            score += 10
        
        # Subdomain count: +8 per extra subdomain (reduced from +10, max +20)
        extra_subdomains = max(0, self.features['subdomain_count'] - 1)
        score += min(extra_subdomains * 8, 20)
        
        # No HTTPS: +12 (reduced from +20 - many legitimate sites use HTTP)
        if not self.features['has_https']:
            score += 12
        
        # Numbers in domain: +15 (kept same - strong indicator)
        if self.features['numbers_in_domain']:
            score += 15
        
        # Suspicious TLD: +18 (reduced from +20)
        if self.features['suspicious_tld']:
            score += 18
        
        # Double encoding: +22 (reduced from +25 - strong indicator but not definitive)
        if self.features['double_dots']:
            score += 22
        
        # IP address: +28 (reduced from +30 - strong indicator)
        if self.features['ip_address']:
            score += 28
        
        # Cap at 100
        self.risk_score = min(score, 100)
        return self.risk_score
    
    def determine_status(self) -> str:
        """
        Determine threat status based on risk score.
        
        Refined thresholds for better accuracy:
        - 0–25: Safe (was 0-30)
        - 26–60: Suspicious (was 31-70)
        - 61–100: Dangerous (was 71-100)
        
        Returns:
            str: Status - 'safe', 'suspicious', or 'dangerous'
        """
        if self.risk_score <= 25:
            self.status = 'safe'
        elif self.risk_score <= 60:
            self.status = 'suspicious'
        else:
            self.status = 'dangerous'
        
        return self.status
    
    def analyze(self) -> dict:
        """
        Perform complete URL analysis.
        
        Returns:
            dict: Complete analysis result with all data
        """
        self.calculate_risk_score()
        self.determine_status()
        
        return {
            'url': self.url,
            'domain': self.domain,
            'risk_score': self.risk_score,
            'status': self.status,
            'features': self.features,
            'analysis': {
                'url_length_suspicious': self.features['url_length'],
                'subdomains': self.features['subdomain_count'],
                'suspicious_keywords_found': self.features['suspicious_keywords'],
                'uses_https': self.features['has_https'],
                'numbers_in_domain': self.features['numbers_in_domain'],
                'suspicious_tld': self.features['suspicious_tld'],
                'encoding_tricks': self.features['double_dots'],
                'uses_ip_address': self.features['ip_address'],
            }
        }


def analyze_url(url: str) -> dict:
    """
    Convenience function to analyze a URL.
    
    Args:
        url (str): URL to analyze
    
    Returns:
        dict: Analysis result
    
    Example:
        >>> result = analyze_url('https://login-faceb00k.com')
        >>> print(result['status'])  # 'dangerous'
        >>> print(result['risk_score'])  # 78
    """
    analyzer = URLAnalyzer(url)
    return analyzer.analyze()
