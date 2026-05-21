"""
Generate expanded phishing URL dataset for ML training
========================================================

Creates 5000+ synthetic URLs with realistic phishing patterns.
"""

import csv
import os

# Safe/Legitimate domains
SAFE_DOMAINS = [
    'google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'facebook.com',
    'github.com', 'stackoverflow.com', 'wikipedia.org', 'linkedin.com', 'reddit.com',
    'github.com', 'twitter.com', 'youtube.com', 'instagram.com', 'netflix.com',
    'stripe.com', 'slack.com', 'figma.com', 'shopify.com', 'wordpress.com',
    'adobe.com', 'salesforce.com', 'ibm.com', 'oracle.com', 'cisco.com',
    'vmware.com', 'google.co.uk', 'bbc.com', 'cnn.com', 'bbc.co.uk',
    'nytimes.com', 'theguardian.com', 'techcrunch.com', 'producthunt.com', 'crunchbase.com'
]

# Phishing-related domains/patterns
PHISHING_DOMAINS = [
    'verify-account', 'confirm-identity', 'update-payment', 'secure-login',
    'bank-verify', 'paypal-confirm', 'amazon-update', 'apple-verify',
    'microsoft-security', 'google-confirm', 'account-verification', 'urgent-action',
    'click-here', 'verify-now', 'confirm-access', 'security-check',
    'unusual-activity', 'verify-password', 'reset-account', 'validate-card'
]

# Phishing TLDs
PHISHING_TLDS = ['.tk', '.ml', '.ga', '.cf', '.xyz', '.pw', '.ws', '.gq', '.top', '.ru', '.cn']

# Legitimate paths
SAFE_PATHS = [
    '/', '/home', '/about', '/contact', '/products', '/services', '/blog',
    '/docs', '/api', '/login', '/dashboard', '/settings', '/profile',
    '/search', '/category', '/article', '/post'
]

# Phishing paths
PHISHING_PATHS = [
    '/verify', '/confirm', '/update', '/check', '/validate', '/urgent',
    '/action-required', '/verify-account', '/confirm-identity', '/admin-panel',
    '/security-alert', '/payment-verification', '/unusual-activity'
]


def generate_safe_urls(count=2500):
    """Generate legitimate URLs."""
    urls = []
    
    for i in range(count):
        domain = SAFE_DOMAINS[i % len(SAFE_DOMAINS)]
        path = SAFE_PATHS[i % len(SAFE_PATHS)]
        
        # Vary with www, subdomains
        if i % 3 == 0:
            domain = 'www.' + domain
        elif i % 3 == 1:
            subdomain = ['api', 'mail', 'blog', 'dev', 'support', 'help'][i % 6]
            domain = f'{subdomain}.{domain}'
        
        # Add some query parameters occasionally
        query = ''
        if i % 7 == 0:
            query = f'?id={i}&ref=search'
        
        url = f'https://{domain}{path}{query}'
        urls.append((url, 0))  # 0 = safe
    
    return urls


def generate_phishing_urls(count=2500):
    """Generate phishing URLs."""
    urls = []
    
    for i in range(count):
        phishing_domain = PHISHING_DOMAINS[i % len(PHISHING_DOMAINS)]
        tld = PHISHING_TLDS[i % len(PHISHING_TLDS)]
        
        # Vary construction
        if i % 4 == 0:
            # Add numbers to domain
            domain = f'{phishing_domain}{i % 100}{tld}'
        elif i % 4 == 1:
            # Add hyphens
            domain = f'{phishing_domain}-{SAFE_DOMAINS[i % len(SAFE_DOMAINS)].split(".")[0]}{tld}'
        elif i % 4 == 2:
            # Use @ symbol (redirect attack)
            domain = f'legitimate{i % 100}@{phishing_domain}{tld}'
        else:
            # Standard suspicious domain
            domain = f'{phishing_domain}{tld}'
        
        path = PHISHING_PATHS[i % len(PHISHING_PATHS)]
        
        # Add query parameters frequently
        query = ''
        if i % 3 == 0:
            query = f'?verify=1&ref=secure'
        elif i % 3 == 1:
            query = f'?action=confirm&id={i}'
        else:
            query = f'?redirect=true&target={i}'
        
        # Mix HTTPS and HTTP
        protocol = 'https' if i % 5 != 0 else 'http'
        
        url = f'{protocol}://{domain}{path}{query}'
        urls.append((url, 1))  # 1 = phishing
    
    return urls


def create_dataset(filename='data/urls_v2.csv', total=5000):
    """Create balanced dataset."""
    print(f"[DATASET] Generating {total} URLs...")
    
    safe_count = total // 2
    phishing_count = total - safe_count
    
    print(f"[DATASET] Safe URLs: {safe_count}")
    print(f"[DATASET] Phishing URLs: {phishing_count}")
    
    safe_urls = generate_safe_urls(safe_count)
    phishing_urls = generate_phishing_urls(phishing_count)
    
    all_urls = safe_urls + phishing_urls
    
    # Shuffle
    import random
    random.shuffle(all_urls)
    
    # Write to CSV
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['url', 'label'])
        writer.writerows(all_urls)
    
    print(f"[DATASET] ✅ Dataset created: {filename}")
    print(f"[DATASET] Total URLs: {len(all_urls)}")
    
    # Verify balance
    labels = [label for _, label in all_urls]
    safe = labels.count(0)
    phishing = labels.count(1)
    print(f"[DATASET] Label distribution: {safe} safe, {phishing} phishing")


if __name__ == '__main__':
    create_dataset('data/urls_v2.csv', total=5000)
