/**
 * Complete Example: URL Checker Component with AI Analysis
 * ===========================================================
 * 
 * This is a complete, production-ready component that shows how to
 * integrate the AI threat detection into your SentraX dashboard.
 * 
 * Place in: src/components/URLChecker.jsx
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Zap, Shield } from 'lucide-react';
import AIAnalysisResults from './AIAnalysisResults';

export const URLChecker = ({ accessToken }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // 🔍 Handle URL checking
  const handleCheckURL = async (url) => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/check-url/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to check URL');
      }

      const data = await response.json();
      setScanResult(data);
      
      // Add to history
      setScanHistory([
        {
          id: Date.now(),
          url: data.url,
          status: data.status,
          riskScore: data.risk_score,
          timestamp: new Date().toLocaleString(),
        },
        ...scanHistory.slice(0, 9), // Keep last 10
      ]);

      setInputUrl(''); // Clear input
    } catch (err) {
      setError(err.message || 'An error occurred while checking the URL');
      console.error('URL check error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleCheckURL(inputUrl);
    }
  };

  // 🟢 Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      safe: {
        bg: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-5 h-5" />,
        text: 'SAFE',
      },
      suspicious: {
        bg: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="w-5 h-5" />,
        text: 'SUSPICIOUS',
      },
      dangerous: {
        bg: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="w-5 h-5" />,
        text: 'DANGEROUS',
      },
    };
    return badges[status] || badges.safe;
  };

  const statusBadge = scanResult ? getStatusBadge(scanResult.status) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 🎯 Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">🔐 SentraX URL Scanner</h1>
          </div>
          <p className="text-gray-600">
            Advanced AI-powered threat detection with intelligent risk scoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 📝 Main Scanner (Left Column) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              {/* 🔗 URL Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter URL to Scan
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com or example.com"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={() => handleCheckURL(inputUrl)}
                    disabled={loading || !inputUrl.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Zap className="w-5 h-5 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        🔍 Check
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ⚠️ Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* ✅ Results */}
              {scanResult && (
                <div className="space-y-6">
                  {/* 📊 Main Result Card */}
                  <div className={`border-2 rounded-lg p-6 ${
                    scanResult.status === 'safe'
                      ? 'border-green-300 bg-green-50'
                      : scanResult.status === 'suspicious'
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-red-300 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">
                          {statusBadge.icon}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{scanResult.domain}</p>
                          <p className="text-sm text-gray-600">
                            {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-bold text-white ${
                        scanResult.status === 'safe'
                          ? 'bg-green-600'
                          : scanResult.status === 'suspicious'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-800">
                      {scanResult.message}
                    </p>
                  </div>

                  {/* 🤖 AI Analysis Component */}
                  {scanResult.ai_analysis && (
                    <AIAnalysisResults analysis={scanResult.ai_analysis} />
                  )}

                  {/* 🚨 Threat Info (if known) */}
                  {scanResult.threat_type && (
                    <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4">
                      <p className="font-semibold text-red-900">
                        🚨 Known Threat Detected: {scanResult.threat_type}
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        This URL matches a known threat in our database.
                      </p>
                    </div>
                  )}

                  {/* 🚫 Block Info (if blocked) */}
                  {scanResult.blocked && (
                    <div className="bg-red-50 border-l-4 border-red-600 rounded-lg p-4">
                      <p className="font-semibold text-red-900">
                        🚫 Access Blocked
                      </p>
                      <p className="text-sm text-red-800 mt-1">
                        {scanResult.reason}
                      </p>
                    </div>
                  )}

                  {/* 💾 Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(scanResult.url);
                        alert('URL copied to clipboard!');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all"
                    >
                      📋 Copy URL
                    </button>
                    <button
                      onClick={() => window.open(scanResult.url, '_blank')}
                      disabled={scanResult.status === 'dangerous'}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🌐 Open Site
                    </button>
                  </div>
                </div>
              )}

              {/* 🎓 Empty State */}
              {!scanResult && !loading && (
                <div className="text-center py-12 text-gray-400">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Enter a URL and click "Check" to scan</p>
                  <p className="text-sm mt-2">
                    AI-powered analysis with 8 security features
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 📊 Scan History (Right Column) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="font-bold text-lg mb-4">📋 Recent Scans</h3>
              
              {scanHistory.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No scans yet
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${
                        item.status === 'safe'
                          ? 'bg-green-50 border-l-green-600'
                          : item.status === 'suspicious'
                          ? 'bg-yellow-50 border-l-yellow-600'
                          : 'bg-red-50 border-l-red-600'
                      }`}
                      onClick={() => setInputUrl(item.url)}
                    >
                      <p className="text-xs font-mono truncate text-gray-600">
                        {item.url}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          item.status === 'safe'
                            ? 'bg-green-200 text-green-800'
                            : item.status === 'suspicious'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {item.riskScore}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.timestamp.split(' ')[1]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 📚 Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl mb-2">🟢</p>
            <p className="font-bold text-sm">SAFE (0-30%)</p>
            <p className="text-xs text-gray-600">Low risk, safe to visit</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl mb-2">🟡</p>
            <p className="font-bold text-sm">SUSPICIOUS (31-70%)</p>
            <p className="text-xs text-gray-600">Proceed with caution</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-2xl mb-2">🔴</p>
            <p className="font-bold text-sm">DANGEROUS (71-100%)</p>
            <p className="text-xs text-gray-600">Blocked for your safety</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default URLChecker;

/**
 * 🚀 Usage in your main app:
 * 
 * import URLChecker from '@/components/URLChecker';
 * 
 * <URLChecker accessToken={userToken} />
 */
