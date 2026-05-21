/**
 * AI Analysis Results Component
 * ===============================
 * Display AI-based threat detection analysis with visual indicators
 * Shows risk score, suspicious keywords, and detailed security features
 * 
 * Supports both:
 * - ML-based analysis (model_used: true)
 * - Rule-based analysis (model_used: false or undefined)
 * 
 * Usage:
 * <AIAnalysisResults analysis={response.ai_analysis} />
 */

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Shield, Cpu, Zap } from 'lucide-react';

export const AIAnalysisResults = ({ analysis }) => {
  if (!analysis) return null;

  // Determine if using ML model
  const isMLBased = analysis.model_used === true;
  const confidence = analysis.confidence || 0;
  const phishingProb = analysis.phishing_probability || 0;

  const getRiskColor = (score) => {
    // Updated thresholds: 0-40 (safe), 41-75 (suspicious), 76-100 (dangerous)
    if (score <= 40) return 'bg-neon-green/10 text-neon-green border-neon-green/20';
    if (score <= 75) return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
    return 'bg-neon-red/10 text-neon-red border-neon-red/20';
  };

  const getRiskIcon = (score) => {
    if (score <= 40) return <CheckCircle className="w-6 h-6 text-neon-green" />;
    if (score <= 75) return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
    return <AlertCircle className="w-6 h-6 text-neon-red" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      safe: { text: 'SAFE', color: 'bg-neon-green text-background' },
      suspicious: { text: 'SUSPICIOUS', color: 'bg-yellow-400 text-background' },
      dangerous: { text: 'DANGEROUS', color: 'bg-neon-red text-background' },
    };
    return labels[status] || labels.safe;
  };

  const getFeatureColor = (condition) => {
    return condition ? 'text-neon-red' : 'text-neon-green';
  };

  const statusLabel = getStatusLabel(analysis.status);

  // Get features - handle both new ML format and old rule-based format
  const features = analysis.features || analysis.analysis || {};

  return (
    <div className={`border rounded-lg p-5 space-y-4 ${getRiskColor(analysis.risk_score)}`}>
      {/* Header with ML Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getRiskIcon(analysis.risk_score)}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">AI Analysis Result</h3>
              {isMLBased && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                  <Cpu className="w-3 h-3" />
                  ML Model
                </span>
              )}
            </div>
            <p className="text-xs opacity-75">
              {analysis.fallback_reason && `Fallback: ${analysis.fallback_reason}`}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusLabel.color}`}>
          {statusLabel.text}
        </span>
      </div>

      {/* Risk Score Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-xs font-semibold">Risk Score</span>
          <span className="text-xs font-bold">{analysis.risk_score}/100</span>
        </div>
        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${
              analysis.risk_score <= 40
                ? 'bg-neon-green'
                : analysis.risk_score <= 75
                ? 'bg-yellow-400'
                : 'bg-neon-red'
            }`}
            style={{ width: `${analysis.risk_score}%` }}
          />
        </div>
      </div>

      {/* ML Confidence Score (if ML-based) */}
      {isMLBased && (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold">ML Confidence</span>
            <span className="text-xs font-bold">{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Security Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* URL Length */}
        {features.url_length !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.url_length > 75)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">URL Length</p>
              <p className="text-xs text-muted-foreground">{features.url_length} chars</p>
            </div>
          </div>
        )}

        {/* HTTPS Check */}
        {features.has_https !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.has_https === 0)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">SSL/HTTPS</p>
              <p className="text-xs text-muted-foreground">{features.has_https ? 'Secure' : 'Insecure'}</p>
            </div>
          </div>
        )}

        {/* Subdomains */}
        {features.subdomain_count !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.subdomain_count > 2)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Subdomains</p>
              <p className="text-xs text-muted-foreground">{features.subdomain_count}</p>
            </div>
          </div>
        )}

        {/* Numbers in Domain */}
        {features.digit_count_domain !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.digit_count_domain > 0)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Domain Numbers</p>
              <p className="text-xs text-muted-foreground">{features.digit_count_domain} found</p>
            </div>
          </div>
        )}

        {/* Suspicious TLD */}
        {features.has_suspicious_tld !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.has_suspicious_tld)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">TLD Status</p>
              <p className="text-xs text-muted-foreground">{features.has_suspicious_tld ? 'Suspicious' : 'Normal'}</p>
            </div>
          </div>
        )}

        {/* Encoding Tricks */}
        {features.unusual_encoding !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.unusual_encoding)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">URL Encoding</p>
              <p className="text-xs text-muted-foreground">{features.unusual_encoding ? 'Suspicious' : 'Normal'}</p>
            </div>
          </div>
        )}

        {/* IP Address */}
        {features.has_ip !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.has_ip)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Uses IP</p>
              <p className="text-xs text-muted-foreground">{features.has_ip ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {/* Keyword Count (ML only) */}
        {features.keyword_count !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Zap className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.keyword_count > 0)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Keywords</p>
              <p className="text-xs text-muted-foreground">{features.keyword_count} found</p>
            </div>
          </div>
        )}

        {/* Dots in Domain */}
        {features.dot_count !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20">
            <Shield className={`w-4 h-4 flex-shrink-0 ${getFeatureColor(features.dot_count > 3)}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold">Domain Dots</p>
              <p className="text-xs text-muted-foreground">{features.dot_count}</p>
            </div>
          </div>
        )}
      </div>

      {/* Suspicious Keywords (from rule-based) */}
      {analysis.analysis?.suspicious_keywords_found?.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2">⚠️ Suspicious Keywords:</p>
          <div className="flex flex-wrap gap-2">
            {analysis.analysis.suspicious_keywords_found.map((keyword) => (
              <span
                key={keyword}
                className="bg-neon-red/20 text-neon-red px-2 py-1 rounded text-xs font-semibold"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detection Method Info */}
      <div className="pt-2 border-t border-current/10">
        <p className="text-xs text-muted-foreground">
          {isMLBased 
            ? '🤖 Detection powered by Machine Learning model' 
            : '📋 Detection using security rules analysis'}
        </p>
      </div>
    </div>
  );
};

export default AIAnalysisResults;
