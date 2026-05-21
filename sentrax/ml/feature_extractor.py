"""
Machine Learning Feature Extraction for URL Phishing Detection
===============================================================

This module converts URLs into numeric features suitable for ML models.
Features are designed to capture phishing indicators.

Enhanced v2.0 with 21 features for improved detection accuracy.
"""

import re
from urllib.parse import urlparse, parse_qs


class URLFeatureExtractor:
    """
    Extract numeric features from URLs for ML model input.
    
    Features extracted (21 total):
    1. url_length - Total length of URL
    2. domain_length - Length of domain
    3. dot_count - Number of dots in domain
    4. dash_count - Number of dashes in domain
    5. has_https - 1 if HTTPS, 0 if HTTP
    6. digit_count_domain - Count of digits in domain
    7. special_char_count - Count of special characters
    8. subdomain_count - Number of subdomains
    9. keyword_count - Count of suspicious keywords
    10. has_ip - 1 if URL uses IP address
    11. has_suspicious_tld - 1 if suspicious TLD
    12. path_length - Length of URL path
    13. port_present - 1 if explicit port specified
    14. unusual_encoding - 1 if encoding tricks detected
    15. at_symbol_count - Count of @ symbols (phishing indicator)
    16. query_param_count - Number of query parameters (? and &)
    17. digit_to_letter_ratio - Ratio of digits to letters (0-1)
    18. hyphen_count - Number of hyphens in URL
    19. suspicious_tld_count - Count of suspicious TLDs
    20. entropy_domain - Shannon entropy of domain
    21. long_domain_flag - 1 if domain extremely long (>25 chars)
    """
    
    # Suspicious keywords commonly found in phishing URLs
    SUSPICIOUS_KEYWORDS = [
        'login', 'verify', 'confirm', 'account', 'secure', 'bank',
        'update', 'check', 'click', 'urgent', 'action', 'required',
        'limited', 'expire', 'claim', 'reward', 'prize', 'free',
        'password', 'reset', 'admin', 'panel', 'validate', 'payment',
        'suspended', 'unauthorized', 'access', 'detected', 'shipping',
        'address', 'credit', 'card', 'safety', 'health', 'alert',
        'restore', 'unusual', 'activity', 'confirm', 're-confirm'
    ]
    
    # Suspicious TLDs (expanded list)
    SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.gq', '.top', '.ru', '.cn', '.pw', '.tk', '.ws']
    
    def __init__(self, url: str):
        """Initialize with a URL."""
        self.url = url.lower().strip()
        self.original_url = self.url  # Store for protocol detection
        
        # CRITICAL: Parse URL correctly regardless of format
        # If URL has no scheme, add http:// for proper parsing
        # This ensures www.apple.com is treated as domain, not path
        if '://' not in self.url:
            url_for_parsing = f'http://{self.url}'
        else:
            url_for_parsing = self.url
            
        self.parsed = urlparse(url_for_parsing)
        self.domain = self.parsed.netloc or self.parsed.path.split('/')[0]
        self.path = self.parsed.path
        
        # NORMALIZATION: Remove "www." prefix for consistent feature extraction
        # This ensures: www.instagram.com → instagram.com (same features as instagram.com)
        # This way variations of the same site get identical risk scores
        if self.domain.startswith('www.'):
            self.domain = self.domain[4:]  # Remove 'www.'
        
        # Rebuild normalized URL for feature extraction
        # Reconstruct URL from normalized components:
        # protocol://domain/path
        scheme = self.parsed.scheme or 'http'
        normalized_url = f'{self.domain}{self.path}'  # domain + path (no protocol for consistency with training data)
        self.normalized_url = normalized_url  # Use for features that need full URL
        
        self.features = {}
    
    def extract_all_features(self) -> list:
        """
        Extract all features and return as a list (for model input).
        
        Returns:
            list: Ordered list of 21 numeric features
        """
        self.features = {
            'url_length': self._url_length(),
            'domain_length': self._domain_length(),
            'dot_count': self._dot_count(),
            'dash_count': self._dash_count(),
            'has_https': self._has_https(),
            'digit_count_domain': self._digit_count_domain(),
            'special_char_count': self._special_char_count(),
            'subdomain_count': self._subdomain_count(),
            'keyword_count': self._keyword_count(),
            'has_ip': self._has_ip(),
            'has_suspicious_tld': self._has_suspicious_tld(),
            'path_length': self._path_length(),
            'port_present': self._port_present(),
            'unusual_encoding': self._unusual_encoding(),
            'at_symbol_count': self._at_symbol_count(),
            'query_param_count': self._query_param_count(),
            'digit_to_letter_ratio': self._digit_to_letter_ratio(),
            'hyphen_count': self._hyphen_count(),
            'suspicious_tld_count': self._suspicious_tld_count(),
            'entropy_domain': self._entropy_domain(),
            'long_domain_flag': self._long_domain_flag(),
        }
        
        # Return as ordered list for model (21 features)
        return [
            self.features['url_length'],
            self.features['domain_length'],
            self.features['dot_count'],
            self.features['dash_count'],
            self.features['has_https'],
            self.features['digit_count_domain'],
            self.features['special_char_count'],
            self.features['subdomain_count'],
            self.features['keyword_count'],
            self.features['has_ip'],
            self.features['has_suspicious_tld'],
            self.features['path_length'],
            self.features['port_present'],
            self.features['unusual_encoding'],
            self.features['at_symbol_count'],
            self.features['query_param_count'],
            self.features['digit_to_letter_ratio'],
            self.features['hyphen_count'],
            self.features['suspicious_tld_count'],
            self.features['entropy_domain'],
            self.features['long_domain_flag'],
        ]
    
    def get_feature_names(self) -> list:
        """Return feature names for model training."""
        return [
            'url_length',
            'domain_length',
            'dot_count',
            'dash_count',
            'has_https',
            'digit_count_domain',
            'special_char_count',
            'subdomain_count',
            'keyword_count',
            'has_ip',
            'has_suspicious_tld',
            'path_length',
            'port_present',
            'unusual_encoding',
            'at_symbol_count',
            'query_param_count',
            'digit_to_letter_ratio',
            'hyphen_count',
            'suspicious_tld_count',
            'entropy_domain',
            'long_domain_flag',
        ]
    
    def _url_length(self) -> int:
        """Length of the entire URL (normalized without www)."""
        return len(self.normalized_url)
    
    def _domain_length(self) -> int:
        """Length of the domain."""
        return len(self.domain)
    
    def _dot_count(self) -> int:
        """Count dots in domain."""
        domain_no_port = self.domain.split(':')[0]
        return domain_no_port.count('.')
    
    def _dash_count(self) -> int:
        """Count dashes in domain."""
        domain_no_port = self.domain.split(':')[0]
        return domain_no_port.count('-')
    
    def _has_https(self) -> int:
        """1 if HTTP (threat in old training data), 0 if HTTPS (safe)."""
        # CRITICAL FIX: Training data was biased - only 0.47% of benign URLs had HTTPS,
        # but 20.80% of malware/phishing did. This made the model treat HTTPS as a threat.
        # In reality, HTTPS is a GOOD sign. We invert this feature:
        # Input has_https → Model sees (1 - has_https)
        # This way: HTTPS URLs get lower threat scores, HTTP URLs get higher scores
        scheme = self.parsed.scheme
        if scheme == 'https':
            return 0  # HTTPS = safe (inverted from raw feature)
        else:
            return 1  # HTTP or no protocol = less safe
    
    def _digit_count_domain(self) -> int:
        """Count digits in domain."""
        domain_no_port = self.domain.split(':')[0]
        return sum(1 for c in domain_no_port if c.isdigit())
    
    def _special_char_count(self) -> int:
        """Count special characters in URL (normalized without www)."""
        special_chars = set('!@#$%^&*()_+=[]{}|;:,.<>?/~`')
        return sum(1 for c in self.normalized_url if c in special_chars)
    
    def _subdomain_count(self) -> int:
        """Count subdomains (number of dots - 1)."""
        domain_no_port = self.domain.split(':')[0]
        # Remove www for cleaner count
        domain_clean = domain_no_port.replace('www.', '')
        dot_count = domain_clean.count('.')
        return max(0, dot_count)  # 0 means no subdomains
    
    def _keyword_count(self) -> int:
        """Count suspicious keywords in URL."""
        count = 0
        for keyword in self.SUSPICIOUS_KEYWORDS:
            # Count whole word matches
            if keyword in self.url:
                count += 1
        return count
    
    def _has_ip(self) -> int:
        """1 if URL uses IP address, 0 otherwise."""
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}'
        domain_no_port = self.domain.split(':')[0]
        return 1 if re.match(ip_pattern, domain_no_port) else 0
    
    def _has_suspicious_tld(self) -> int:
        """1 if domain has suspicious TLD, 0 otherwise."""
        for tld in self.SUSPICIOUS_TLDS:
            if self.domain.endswith(tld):
                return 1
        return 0
    
    def _path_length(self) -> int:
        """Length of URL path."""
        return len(self.path)
    
    def _port_present(self) -> int:
        """1 if URL has explicit port, 0 otherwise."""
        return 1 if ':' in self.domain else 0
    
    def _unusual_encoding(self) -> int:
        """1 if URL has unusual encoding tricks, 0 otherwise."""
        encoding_patterns = ['%2e', '%252e', '\\\\', '..']
        return 1 if any(pattern in self.url for pattern in encoding_patterns) else 0


    def _at_symbol_count(self) -> int:
        """Count @ symbols (indicates redirect/phishing)."""
        return self.url.count('@')
    
    def _query_param_count(self) -> int:
        """Count query parameters (? and &)."""
        return self.url.count('?') + self.url.count('&')
    
    def _digit_to_letter_ratio(self) -> float:
        """Calculate ratio of digits to total letters/digits."""
        digits = sum(1 for c in self.url if c.isdigit())
        letters = sum(1 for c in self.url if c.isalpha())
        
        if letters + digits == 0:
            return 0.0
        return digits / (letters + digits)
    
    def _hyphen_count(self) -> int:
        """Count hyphens in domain."""
        domain_no_port = self.domain.split(':')[0]
        return domain_no_port.count('-')
    
    def _suspicious_tld_count(self) -> int:
        """Count number of suspicious TLDs found in domain."""
        count = 0
        for tld in self.SUSPICIOUS_TLDS:
            if self.domain.endswith(tld):
                count += 1
        return count
    
    def _entropy_domain(self) -> float:
        """
        Calculate Shannon entropy of domain.
        High entropy = more randomness = potential phishing.
        """
        domain_no_port = self.domain.split(':')[0]
        if not domain_no_port:
            return 0.0
        
        # Calculate frequency of each character
        freq = {}
        for char in domain_no_port:
            freq[char] = freq.get(char, 0) + 1
        
        # Calculate Shannon entropy
        import math
        entropy = 0.0
        domain_len = len(domain_no_port)
        
        for count in freq.values():
            probability = count / domain_len
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        return entropy
    
    def _long_domain_flag(self) -> int:
        """1 if domain is extremely long (>25 chars), 0 otherwise."""
        domain_no_port = self.domain.split(':')[0]
        return 1 if len(domain_no_port) > 25 else 0


def extract_features_from_url(url: str) -> list:
    """
    Convenience function to extract 21 features from a single URL.
    
    Args:
        url (str): URL to extract features from
        
    Returns:
        list: Feature vector (21 elements) for model input
    """
    extractor = URLFeatureExtractor(url)
    return extractor.extract_all_features()


def get_feature_names() -> list:
    """Get list of feature names."""
    extractor = URLFeatureExtractor('https://example.com')
    return extractor.get_feature_names()
