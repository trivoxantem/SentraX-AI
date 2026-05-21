"""
Direct test of Google Safe Browsing API
No Django setup required
"""
import requests
import json

API_KEY = "AIzaSyCjEcV8Zv2dIrSWEe1rmf3IWo8oXX-Mn3Q"
API_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

def test_google_safe_browsing(url):
    """Test a URL against Google Safe Browsing API"""
    
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
    
    print(f"\n📋 Testing URL: {url}")
    print("-" * 60)
    
    try:
        response = requests.post(
            API_URL,
            json=payload,
            params={'key': API_KEY},
            timeout=5
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if 'matches' in data and len(data['matches']) > 0:
                print(f"⚠️  MALICIOUS - Threats detected:")
                for match in data['matches']:
                    print(f"   • Threat Type: {match.get('threatType')}")
                    print(f"   • Platform: {match.get('platformType')}")
            else:
                print(f"✅ SAFE - No threats detected")
            
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("GOOGLE SAFE BROWSING API TEST")
    print("=" * 60)
    print(f"API Key (masked): {API_KEY[:10]}...{API_KEY[-4:]}")
    print(f"API Endpoint: {API_URL}")
    
    # Test with known malicious URLs
    test_urls = [
        "https://www.google.com",  # Safe
        "http://malware.wicar.org/data/java/Exploit.SWF",  # Known malicious
        "https://testsafebrowsing.appspot.com/s/malware/",  # Known malicious
    ]
    
    for url in test_urls:
        test_google_safe_browsing(url)
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
