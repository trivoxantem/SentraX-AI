import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import blockService from '@/api/block';
import urlService from '@/api/url';
import { motion } from 'framer-motion';
import { Shield, Plus, Trash2, Globe, Search, CheckCircle2, AlertTriangle, XCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import GlassCard from '@/components/shared/GlassCard';
import AIAnalysisResults from '@/components/AIAnalysisResults';

export default function Protection() {
  const [newDomain, setNewDomain] = useState('');
  const [scanUrl, setScanUrl] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [blockMessage, setBlockMessage] = useState('');
  const [blockError, setBlockError] = useState('');
  const queryClient = useQueryClient();

  // Fetch block rules
  const { data: blockData = { count: 0, rules: [] }, isLoading: isLoadingRules } = useQuery({
    queryKey: ['block-rules'],
    queryFn: () => blockService.getBlockRules(),
  });

  const blockRules = blockData.rules || [];

  // Create block rule mutation
  const createMutation = useMutation({
    mutationFn: (domain) => blockService.addBlockRule(domain),
    onSuccess: (data) => {
      // Optimistically update the cache with the new rule
      const newRule = data.rule;
      queryClient.setQueryData(['block-rules'], (oldData) => ({
        count: (oldData?.count || 0) + 1,
        rules: [newRule, ...(oldData?.rules || [])],
      }));
      
      setNewDomain('');
      setBlockMessage('Domain blocked successfully!');
      setTimeout(() => setBlockMessage(''), 3000);
    },
    onError: (error) => {
      setBlockError(error.message);
      setTimeout(() => setBlockError(''), 3000);
    },
  });

  // Delete block rule mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => blockService.deleteBlockRule(id),
    onSuccess: (data, deletedId) => {
      // Optimistically update the cache by removing the deleted rule
      queryClient.setQueryData(['block-rules'], (oldData) => ({
        count: Math.max((oldData?.count || 1) - 1, 0),
        rules: (oldData?.rules || []).filter((rule) => rule.id !== deletedId),
      }));
    },
  });

  const handleAddBlockRule = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) {
      setBlockError('Domain is required');
      setTimeout(() => setBlockError(''), 3000);
      return;
    }
    createMutation.mutate(newDomain.trim());
  };

  const handleScanUrl = async (e) => {
    e.preventDefault();
    if (!scanUrl.trim()) return;

    setIsScanning(true);
    setScanError('');
    setScanResult(null);

    try {
      const result = await urlService.checkUrl(scanUrl);
      setScanResult(result);
    } catch (error) {
      setScanError(error.message || 'Failed to scan URL');
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle2,
          color: 'text-neon-green',
          bg: 'bg-neon-green/10',
          border: 'border-neon-green/20',
          label: 'Safe',
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          border: 'border-yellow-400/20',
          label: 'Suspicious',
        };
      case 'dangerous':
        return {
          icon: XCircle,
          color: 'text-neon-red',
          bg: 'bg-neon-red/10',
          border: 'border-neon-red/20',
          label: 'Dangerous',
        };
      default:
        return {
          icon: Shield,
          color: 'text-muted-foreground',
          bg: 'bg-muted/10',
          border: 'border-muted/20',
          label: 'Unknown',
        };
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Protection</h1>
        <p className="text-sm text-muted-foreground mt-1">Scan URLs and manage security rules</p>
      </motion.div>

      {/* URL Scanner */}
      <GlassCard hover={false} className="border-2 border-neon-blue/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center">
            <Search className="w-4 h-4 text-neon-blue" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Scan URL</h3>
        </div>

        <form onSubmit={handleScanUrl} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              placeholder="Enter URL to scan (e.g. google.com or https://example.com)"
              className="flex-1 bg-muted/30 border-border/30 h-10 font-mono text-sm"
              disabled={isScanning}
            />
            <Button
              type="submit"
              disabled={isScanning}
              className="bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-10 rounded-xl px-6"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan
                </>
              )}
            </Button>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              {(() => {
                const config = getStatusConfig(scanResult.status);
                const StatusIcon = config.icon;

                return (
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg border ${config.bg} ${config.border}`}>
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                            <span className="text-xs text-muted-foreground">Risk: {scanResult.risk_score}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mb-2">{scanResult.url}</p>
                          <p className="text-sm text-foreground">{scanResult.message}</p>
                          {scanResult.threat_type && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Threat Type: <span className="font-mono">{scanResult.threat_type}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Analysis Component */}
                    {scanResult.ai_analysis && (
                      <AIAnalysisResults analysis={scanResult.ai_analysis} />
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Scan Error */}
          {scanError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="p-4 rounded-lg bg-neon-red/10 border border-neon-red/20">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-neon-red flex-shrink-0" />
                  <p className="text-sm text-neon-red">{scanError}</p>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </GlassCard>

      {/* Add Block Rule */}
      <GlassCard hover={false}>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-neon-blue" />
          Block Website
        </h3>
        <form onSubmit={handleAddBlockRule} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="Enter domain to block (e.g. facebook.com)"
              className="flex-1 bg-muted/30 border-border/30 h-10 font-mono text-sm"
              disabled={createMutation.isPending}
            />
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-neon-red to-orange-500 text-background font-semibold h-10 rounded-xl px-6"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Block
                </>
              )}
            </Button>
          </div>

          {/* Block Success Message */}
          {blockMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
              <p className="text-sm text-neon-green">{blockMessage}</p>
            </motion.div>
          )}

          {/* Block Error Message */}
          {blockError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/20">
              <p className="text-sm text-neon-red">{blockError}</p>
            </motion.div>
          )}
        </form>
      </GlassCard>

      {/* Blocked Domains List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Blocked Domains ({blockRules.length})</h3>
        </div>

        {isLoadingRules ? (
          <GlassCard hover={false} className="text-center py-8">
            <Loader2 className="w-6 h-6 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading blocked domains...</p>
          </GlassCard>
        ) : blockRules.length === 0 ? (
          <GlassCard hover={false} className="text-center py-12">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No blocked domains yet. Add one above to get started.</p>
          </GlassCard>
        ) : (
          blockRules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-neon-red/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-4 h-4 text-neon-red" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-foreground truncate">{rule.domain}</p>
                    <p className="text-xs text-muted-foreground">Blocked</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(rule.id)}
                  disabled={deleteMutation.isPending}
                  className="text-muted-foreground hover:text-neon-red h-8 w-8 flex-shrink-0"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </Button>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}