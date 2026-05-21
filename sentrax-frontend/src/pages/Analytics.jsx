import { motion } from 'framer-motion';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import GlassCard from '@/components/shared/GlassCard';
import AnimatedCounter from '@/components/shared/AnimatedCounter';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/api/axios';
import { AlertCircle, Loader } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground font-mono mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  // Fetch analytics data
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await axiosInstance.get('analytics/');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (error) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        </motion.div>
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500">Error loading analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Use empty defaults while loading
  const summary = analyticsData?.summary || {};
  const dailyActivity = analyticsData?.daily_activity || [];
  const topRiskyDomains = analyticsData?.top_risky_domains || [];
  const threatCategories = analyticsData?.threat_categories || [];

  // Format daily activity for chart
  const chartDailyData = dailyActivity.map(day => ({
    day: day.day,
    safe: day.safe,
    suspicious: day.suspicious,
    dangerous: day.dangerous,
    total: day.total,
  }));

  // Format threat categories for pie chart
  const chartThreatData = threatCategories.map(cat => ({
    name: cat.name,
    value: cat.value,
    fill: getThreatColor(cat.name),
  }));

  // Format top risky domains for bar chart
  const chartDomainData = topRiskyDomains.slice(0, 5).map(domain => ({
    domain: domain.domain.length > 20 ? domain.domain.substring(0, 17) + '...' : domain.domain,
    risk: domain.max_risk,
    count: domain.count,
  }));

  const safetyScore = summary.safety_score || 0;
  const totalScans = summary.total_scans || 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Threat intelligence and security insights</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard glow="blue">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Total Scans</p>
          <div className="text-3xl font-bold text-foreground">
            {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <AnimatedCounter value={totalScans} />}
          </div>
          <p className="text-xs text-muted-foreground mt-2">URLs analyzed</p>
        </GlassCard>

        <GlassCard glow="green">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Safe Sites</p>
          <div className="text-3xl font-bold text-foreground">
            {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <AnimatedCounter value={summary.safe_count || 0} />}
          </div>
          <p className="text-xs text-muted-foreground mt-2">✅ No threats detected</p>
        </GlassCard>

        <GlassCard glow="yellow">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Suspicious</p>
          <div className="text-3xl font-bold text-foreground">
            {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <AnimatedCounter value={summary.suspicious_count || 0} />}
          </div>
          <p className="text-xs text-muted-foreground mt-2">⚠️ Caution recommended</p>
        </GlassCard>

        <GlassCard glow="red">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Dangerous</p>
          <div className="text-3xl font-bold text-foreground">
            {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <AnimatedCounter value={summary.dangerous_count || 0} />}
          </div>
          <p className="text-xs text-muted-foreground mt-2">🚨 Blocked for safety</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Safety Score */}
        <GlassCard glow="green" className="flex flex-col items-center justify-center">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4">Safety Score</h3>
          <div className="h-48 w-48">
            {!isLoading ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ name: 'Score', value: safetyScore, fill: safetyScore > 80 ? '#00FF88' : safetyScore > 50 ? '#FFB800' : '#FF4444' }]} startAngle={180} endAngle={0}>
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="text-center -mt-8">
            <div className="text-4xl font-bold text-foreground">
              {isLoading ? '—' : <AnimatedCounter value={safetyScore} suffix="%" />}
            </div>
            <p className="text-xs text-neon-green mt-1">
              {safetyScore > 80 ? 'Excellent' : safetyScore > 50 ? 'Good' : 'At Risk'}
            </p>
          </div>
        </GlassCard>

        {/* Daily Activity */}
        <GlassCard hover={false} className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-1">Daily Activity (7 Days)</h3>
          <p className="text-xs text-muted-foreground mb-4">URL checks by threat level</p>
          <div className="h-56">
            {!isLoading && chartDailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDailyData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="safe" fill="#00FF88" radius={[4, 4, 0, 0]} name="Safe" stackId="a" />
                  <Bar dataKey="suspicious" fill="#FFB800" radius={[4, 4, 0, 0]} name="Suspicious" stackId="a" />
                  <Bar dataKey="dangerous" fill="#FF4444" radius={[4, 4, 0, 0]} name="Dangerous" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Threat Categories */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Threat Categories</h3>
          {!isLoading && chartThreatData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartThreatData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {chartThreatData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1 max-h-48 overflow-y-auto">
                {chartThreatData.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                      <span className="text-xs text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="text-xs font-mono text-foreground">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              {isLoading ? (
                <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-xs text-muted-foreground">No threat data available</p>
              )}
            </div>
          )}
        </GlassCard>

        {/* Top Risky Domains */}
        <GlassCard hover={false}>
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Risky Domains</h3>
          {!isLoading && chartDomainData.length > 0 ? (
            <div className="space-y-3">
              {chartDomainData.map((domain, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-mono text-foreground truncate">{domain.domain}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${getRiskBadgeColor(domain.risk)}`}>
                      {domain.risk}%
                    </span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getRiskBarColor(domain.risk)}`}
                      style={{ width: `${domain.risk}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Detected {domain.count} time{domain.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              {isLoading ? (
                <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-xs text-muted-foreground">No risky domains detected</p>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// Helper functions
function getThreatColor(threatName) {
  const colors = {
    'Phishing': '#EF4444',
    'Malware': '#DC2626',
    'Tracking': '#8B5CF6',
    'Scam': '#F59E0B',
    'Adult Content': '#EC4899',
    'Other': '#6B7280',
  };
  return colors[threatName] || '#6B7280';
}

function getRiskBadgeColor(riskScore) {
  if (riskScore >= 80) return 'bg-red-500/20 text-red-400';
  if (riskScore >= 50) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-green-500/20 text-green-400';
}

function getRiskBarColor(riskScore) {
  if (riskScore >= 80) return 'bg-red-500';
  if (riskScore >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}