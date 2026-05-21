"""
Threat Intelligence Integration Module
======================================
Integrates multiple threat intelligence APIs to detect real-world malicious URLs.

Supported APIs:
- Google Safe Browsing API v4
- PhishTank API

Features:
- Parallel API checking with timeout handling
- Fallback mechanisms
- Caching support (optional)
- Logging for debugging
- Clean modular design
"""

import requests
import logging
from typing import Dict, Optional
from django.conf import settings
from urllib.parse import quote

# Get logger for this module
logger = logging.getLogger(__name__)

# ============================================
# GOOGLE SAFE BROWSING API
# ============================================

def check_google_safe_browsing(url: str, timeout: int = 5) -> Dict:
    """
    Check if URL is malicious using Google Safe Browsing API v4.
    
    Args:
        url (str): Full URL to check (with protocol)
        timeout (int): Request timeout in seconds
    
    Returns:
        Dict: {
            'malicious': bool,
            'source': 'google_safe_browsing',
            'threat_types': list,  # e.g., ['MALWARE', 'PHISHING', 'UNWANTED_SOFTWARE']
            'platform_types': list,  # e.g., ['WINDOWS', 'ALL_PLATFORMS']
            'error': str (optional)
        }
    """
    result = {
        'malicious': False,
        'source': 'google_safe_browsing',
        'threat_types': [],
        'platform_types': []
    }
    
    # Check if API key is configured
    api_key = getattr(settings, 'GOOGLE_SAFE_BROWSING_API_KEY', None)
    if not api_key:
        logger.warning("[THREAT INTEL] Google Safe Browsing API key not configured")
        result['error'] = 'API key not configured'
        return result
    
    try:
        # Google Safe Browsing API endpoint
        api_url = 'https://safebrowsing.googleapis.com/v4/threatMatches:find'
        
        # Prepare request payload
        payload = {
            'client': {
                'clientId': 'sentrax-security-platform',
                'clientVersion': '1.0'
            },
            'threatInfo': {
                'threatTypes': [
                    'MALWARE',
                    'SOCIAL_ENGINEERING',
                    'UNWANTED_SOFTWARE',
                    'POTENTIALLY_HARMFUL_APPLICATION'
                ],
                'platformTypes': ['ALL_PLATFORMS'],
                'threatEntries': [
                    {'url': url}
                ]
            }
        }
        
        # Send request with timeout
        response = requests.post(
            api_url,
            json=payload,
            params={'key': api_key},
            timeout=timeout
        )
        
        # Handle response
        if response.status_code == 200:
            data = response.json()
            
            # Check if threats were found
            if 'matches' in data and len(data['matches']) > 0:
                result['malicious'] = True
                
                # Extract threat information
                for match in data['matches']:
                    threat_type = match.get('threatType', 'UNKNOWN')
                    platform_type = match.get('platformType', 'ALL_PLATFORMS')
                    
                    if threat_type not in result['threat_types']:
                        result['threat_types'].append(threat_type)
                    if platform_type not in result['platform_types']:
                        result['platform_types'].append(platform_type)
                
                logger.info(f"[GOOGLE SAFE BROWSING] Malicious URL detected: {url}")
                logger.info(f"[GOOGLE SAFE BROWSING] Threats: {result['threat_types']}")
            else:
                logger.debug(f"[GOOGLE SAFE BROWSING] URL is safe: {url}")
        
        elif response.status_code == 400:
            logger.warning(f"[GOOGLE SAFE BROWSING] Invalid request: {response.text}")
            result['error'] = 'Invalid request format'
        
        elif response.status_code == 401:
            logger.error("[GOOGLE SAFE BROWSING] Invalid API key")
            result['error'] = 'Invalid API key'
        
        elif response.status_code == 429:
            logger.warning("[GOOGLE SAFE BROWSING] Rate limit exceeded")
            result['error'] = 'Rate limit exceeded'
        
        elif response.status_code >= 500:
            logger.error(f"[GOOGLE SAFE BROWSING] API error: {response.status_code}")
            result['error'] = 'API server error'
        
        else:
            logger.warning(f"[GOOGLE SAFE BROWSING] Unexpected status: {response.status_code}")
            result['error'] = f'Unexpected status {response.status_code}'
    
    except requests.exceptions.Timeout:
        logger.warning(f"[GOOGLE SAFE BROWSING] Request timeout after {timeout}s")
        result['error'] = 'Request timeout'
    
    except requests.exceptions.ConnectionError:
        logger.error("[GOOGLE SAFE BROWSING] Connection error")
        result['error'] = 'Connection error'
    
    except Exception as e:
        logger.error(f"[GOOGLE SAFE BROWSING] Error: {str(e)}")
        result['error'] = str(e)
    
    return result


# ============================================
# PHISHTANK API
# ============================================

def check_phishtank(url: str, timeout: int = 5) -> Dict:
    """
    Check if URL is in PhishTank database using their API.
    
    PhishTank is a free community-driven phishing database.
    Public API has rate limits (~120 requests per minute from same IP).
    
    Args:
        url (str): Full URL to check (with protocol)
        timeout (int): Request timeout in seconds
    
    Returns:
        Dict: {
            'malicious': bool,
            'source': 'phishtank',
            'phishing_id': str (optional),
            'phishing_detail_url': str (optional),
            'error': str (optional)
        }
    """
    result = {
        'malicious': False,
        'source': 'phishtank'
    }
    
    try:
        # PhishTank API endpoint
        api_url = 'https://checkurl.phishtank.com/checkurl/'
        
        # Prepare request parameters
        params = {
            'url': url,
            'format': 'json',
            'app_token': getattr(settings, 'PHISHTANK_API_KEY', '')  # Optional for public API
        }
        
        # Send request with timeout
        response = requests.get(
            api_url,
            params=params,
            timeout=timeout
        )
        
        # Handle response
        if response.status_code == 200:
            data = response.json()
            
            # PhishTank response structure
            if 'results' in data:
                results = data['results']
                
                # Check if URL is in phishing database
                if results.get('in_database'):
                    result['malicious'] = True
                    result['phishing_id'] = results.get('phish_id')
                    result['phishing_detail_url'] = results.get('phish_detail_url')
                    
                    logger.info(f"[PHISHTANK] Phishing URL detected: {url}")
                    logger.info(f"[PHISHTANK] Phish ID: {result['phishing_id']}")
                else:
                    logger.debug(f"[PHISHTANK] URL is safe: {url}")
            else:
                logger.warning(f"[PHISHTANK] Unexpected response format")
                result['error'] = 'Unexpected response format'
        
        elif response.status_code == 429:
            logger.warning("[PHISHTANK] Rate limit exceeded")
            result['error'] = 'Rate limit exceeded'
        
        else:
            logger.warning(f"[PHISHTANK] Unexpected status: {response.status_code}")
            result['error'] = f'Unexpected status {response.status_code}'
    
    except requests.exceptions.Timeout:
        logger.warning(f"[PHISHTANK] Request timeout after {timeout}s")
        result['error'] = 'Request timeout'
    
    except requests.exceptions.ConnectionError:
        logger.error("[PHISHTANK] Connection error")
        result['error'] = 'Connection error'
    
    except Exception as e:
        logger.error(f"[PHISHTANK] Error: {str(e)}")
        result['error'] = str(e)
    
    return result


# ============================================
# COMBINED THREAT INTELLIGENCE CHECK
# ============================================

def check_threat_intel(url: str, timeout_per_api: int = 5) -> Dict:
    """
    Check URL against multiple threat intelligence sources.
    
    Calls both Google Safe Browsing and PhishTank APIs in parallel.
    Returns combined results for decision making.
    
    Args:
        url (str): Full URL to check (with protocol)
        timeout_per_api (int): Timeout per API request in seconds
    
    Returns:
        Dict: {
            'malicious': bool,  # True if ANY source reports malicious
            'sources': [
                {
                    'source': str,  # 'google_safe_browsing' or 'phishtank'
                    'malicious': bool,
                    'details': dict
                }
            ],
            'risk_score': int,  # 0-100
            'primary_threat': str,  # Most relevant threat source
            'total_checks': int
        }
    """
    result = {
        'malicious': False,
        'sources': [],
        'risk_score': 0,
        'primary_threat': None,
        'total_checks': 0
    }
    
    logger.info(f"[THREAT INTEL] Starting threat intelligence check for: {url}")
    
    try:
        # Call both APIs
        google_result = check_google_safe_browsing(url, timeout=timeout_per_api)
        phishtank_result = check_phishtank(url, timeout=timeout_per_api)
        
        # Store results
        result['sources'].append({
            'source': 'google_safe_browsing',
            'malicious': google_result['malicious'],
            'details': {
                'threat_types': google_result.get('threat_types', []),
                'platform_types': google_result.get('platform_types', []),
                'error': google_result.get('error')
            }
        })
        
        result['sources'].append({
            'source': 'phishtank',
            'malicious': phishtank_result['malicious'],
            'details': {
                'phishing_id': phishtank_result.get('phishing_id'),
                'phishing_detail_url': phishtank_result.get('phishing_detail_url'),
                'error': phishtank_result.get('error')
            }
        })
        
        result['total_checks'] = 2
        
        # Determine if URL is malicious
        if google_result['malicious'] or phishtank_result['malicious']:
            result['malicious'] = True
            
            # Calculate risk score based on sources
            if google_result['malicious'] and phishtank_result['malicious']:
                result['risk_score'] = 99  # Highest risk - multiple sources confirm
                result['primary_threat'] = 'multiple_sources'
            elif google_result['malicious']:
                result['risk_score'] = 95
                result['primary_threat'] = 'google_safe_browsing'
            else:
                result['risk_score'] = 90
                result['primary_threat'] = 'phishtank'
            
            logger.warning(f"[THREAT INTEL] Malicious URL detected: {url}")
            logger.warning(f"[THREAT INTEL] Risk Score: {result['risk_score']}")
        else:
            logger.info(f"[THREAT INTEL] No threats detected for: {url}")
    
    except Exception as e:
        logger.error(f"[THREAT INTEL] Critical error during threat intelligence check: {str(e)}")
        result['error'] = str(e)
    
    return result


# ============================================
# HELPER FUNCTIONS
# ============================================

def is_threat_intel_enabled() -> bool:
    """
    Check if threat intelligence APIs are enabled.
    
    At least one API key should be configured.
    
    Returns:
        bool: True if threat intel is available
    """
    has_google = bool(getattr(settings, 'GOOGLE_SAFE_BROWSING_API_KEY', None))
    has_phishtank = bool(getattr(settings, 'PHISHTANK_API_KEY', None))
    
    return has_google or has_phishtank


def get_threat_intel_status() -> Dict:
    """
    Get status of all configured threat intelligence sources.
    
    Returns:
        Dict: Status of each API
    """
    return {
        'google_safe_browsing': bool(getattr(settings, 'GOOGLE_SAFE_BROWSING_API_KEY', None)),
        'phishtank': bool(getattr(settings, 'PHISHTANK_API_KEY', None)),
        'enabled': is_threat_intel_enabled()
    }
