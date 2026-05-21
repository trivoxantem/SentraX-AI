#!/usr/bin/env python3
"""Debug URL variations."""

from ml.feature_extractor import URLFeatureExtractor

test_urls = [
    'https://instagram.com/',
    'https://www.instagram.com/',
    'www.apple.com',
    'https://samsung.com'
]

feature_names = [
    'url_length', 'domain_length', 'dot_count', 'dash_count',
    'has_https', 'digit_count_domain', 'special_char_count',
    'subdomain_count', 'keyword_count', 'has_ip',
    'has_suspicious_tld', 'path_length', 'port_present',
    'unusual_encoding', 'at_symbol_count', 'query_param_count',
    'digit_to_letter_ratio', 'hyphen_count', 'suspicious_tld_count',
    'entropy_domain', 'long_domain_flag'
]

for url in test_urls:
    print(f"\nURL: {url}")
    print("=" * 70)
    extractor = URLFeatureExtractor(url)
    features = extractor.extract_all_features()
    
    # Show only the first 14 features (what v1 uses)
    for i, (name, value) in enumerate(zip(feature_names[:14], features[:14])):
        print(f"{i+1:2}. {name:25} = {value}")
