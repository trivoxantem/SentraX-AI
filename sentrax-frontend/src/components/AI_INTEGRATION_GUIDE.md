/**
 * Integration Guide: AI Analysis Component
 * =========================================
 * 
 * This guide shows how to integrate the AIAnalysisResults component
 * into your existing dashboard and URL checking views.
 */

// ============================================
// 1. IMPORT THE COMPONENT
// ============================================
import AIAnalysisResults from '@/components/AIAnalysisResults';

// ============================================
// 2. IN YOUR URL CHECK VIEW OR COMPONENT
// ============================================

export const URLCheckView = () => {
  const [scanResult, setScanResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleCheckURL = async (url) => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-url/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      setScanResult(data);
    } catch (error) {
      console.error('URL check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🔐 URL Security Scanner</h2>

        {/* URL Input Form */}
        <div className="mb-6">
          <input
            type="url"
            placeholder="Enter URL to check (e.g., https://example.com)"
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleCheckURL(inputUrl)}
            disabled={loading}
            className="mt-3 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Scanning...' : '🔍 Check URL'}
          </button>
        </div>

        {/* Results Display */}
        {scanResult && (
          <div className="space-y-4">
            {/* Basic Result Card */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Scan Result</h3>
                <span className={`px-4 py-2 rounded-full text-white font-bold ${
                  scanResult.status === 'safe' ? 'bg-green-600' :
                  scanResult.status === 'suspicious' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}>
                  {scanResult.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-700">{scanResult.message}</p>
            </div>

            {/* AI Analysis Component */}
            {scanResult.ai_analysis && (
              <AIAnalysisResults analysis={scanResult.ai_analysis} />
            )}

            {/* Threat Information */}
            {scanResult.threat_type && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="font-semibold text-red-900">
                  🚨 Known Threat: {scanResult.threat_type}
                </p>
              </div>
            )}

            {/* Block Status */}
            {scanResult.blocked && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="font-semibold text-red-900">
                  🚫 {scanResult.reason}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// 3. EXAMPLE API RESPONSE
// ============================================

/*
{
  "url": "https://login-faceb00k.com",
  "domain": "login-faceb00k.com",
  "status": "dangerous",
  "risk_score": 78,
  "threat_type": null,
  "blocked": false,
  "reason": "Blocked by your rules",
  "message": "🚨 Dangerous - Blocked for your safety (Risk: 78%)",
  "ai_analysis": {
    "url": "https://login-faceb00k.com",
    "domain": "login-faceb00k.com",
    "risk_score": 78,
    "status": "dangerous",
    "features": {
      "url_length": false,
      "subdomain_count": 0,
      "suspicious_keywords": ["login", "facebook"],
      "has_https": true,
      "numbers_in_domain": true,
      "suspicious_tld": false,
      "double_dots": false,
      "ip_address": false
    },
    "analysis": {
      "url_length_suspicious": false,
      "subdomains": 0,
      "suspicious_keywords_found": ["login", "facebook"],
      "uses_https": true,
      "numbers_in_domain": true,
      "suspicious_tld": false,
      "encoding_tricks": false,
      "uses_ip_address": false
    }
  }
}
*/

// ============================================
// 4. IN DASHBOARD - RECENT SCANS
// ============================================

export const RecentScansCard = ({ activities }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="font-bold text-lg mb-4">📊 Recent URL Scans</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold truncate">{activity.url}</p>
              <p className="text-xs text-gray-600">{activity.timestamp}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                activity.status === 'safe' ? 'bg-green-600' :
                activity.status === 'suspicious' ? 'bg-yellow-600' :
                'bg-red-600'
              }`}>
                {activity.risk_score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// 5. STYLING REQUIREMENTS
// ============================================

/*
Ensure your project has:
- Tailwind CSS for styling
- Lucide React for icons

Install if missing:
  npm install lucide-react

The AIAnalysisResults component uses:
- Tailwind utility classes
- Lucide React icons:
  * AlertCircle
  * CheckCircle
  * AlertTriangle
  * Shield
*/

// ============================================
// 6. CUSTOMIZATION OPTIONS
// ============================================

/*
You can customize the AIAnalysisResults component by:

1. Changing color scheme:
   - Replace bg-green-100 with your preferred color
   - Update status colors for different themes

2. Adding more security checks:
   - Extend the features grid by adding new Shield items
   - The component dynamically displays all analysis features

3. Implementing additional actions:
   - Add buttons to block domain
   - Create rules from analysis
   - Export scan reports

4. Real-time analysis:
   - Call /api/check-url/ as user types in input
   - Debounce requests to avoid excessive API calls
   - Show loading states during analysis
*/

// ============================================
// 7. PERFORMANCE CONSIDERATIONS
// ============================================

/*
- The URL analyzer runs locally (no ML model needed yet)
- Analysis completes in <100ms
- Results are cached in ActivityLog for historical analysis
- Use React.memo() to prevent unnecessary re-renders:

  const AIAnalysisResultsMemo = React.memo(AIAnalysisResults);
*/
