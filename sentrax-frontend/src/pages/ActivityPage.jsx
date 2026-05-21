import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import activityService from '@/api/activity';
import { motion } from 'framer-motion';
import { Search, Filter, Activity, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GlassCard from '@/components/shared/GlassCard';
import { formatDistanceToNow, format } from 'date-fns';

export default function ActivityPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch activities from backend
  const { data: activitiesData = { count: 0, activities: [] }, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: () => activityService.getActivities(),
  });

  const activities = activitiesData.activities || [];

  // Filter activities
  const filtered = activities.filter(item => {
    const matchSearch = item.url.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Get status icon and color
  const getStatusConfig = (status) => {
    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle2,
          color: 'text-neon-green',
          bg: 'bg-neon-green/10',
          label: 'Safe',
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-400',
          bg: 'bg-yellow-400/10',
          label: 'Suspicious',
        };
      case 'dangerous':
        return {
          icon: XCircle,
          color: 'text-neon-red',
          bg: 'bg-neon-red/10',
          label: 'Dangerous',
        };
      default:
        return {
          icon: Activity,
          color: 'text-muted-foreground',
          bg: 'bg-muted/10',
          label: 'Unknown',
        };
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor all URL scans and security events</p>
      </motion.div>

      {/* Filters */}
      <GlassCard hover={false} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/30 border border-border/30">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search URLs..."
            className="border-0 bg-transparent h-8 px-0 focus-visible:ring-0 font-mono text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-muted/30 border-border/30 h-10">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent className="glass border-border/50">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="safe">Safe</SelectItem>
            <SelectItem value="suspicious">Suspicious</SelectItem>
            <SelectItem value="dangerous">Dangerous</SelectItem>
          </SelectContent>
        </Select>
      </GlassCard>

      {/* Activity Count */}
      {activities.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground">
          Showing {filtered.length} of {activities.length} scans
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <GlassCard hover={false} className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading activity logs...</p>
        </GlassCard>
      )}

      {/* Error State */}
      {error && (
        <GlassCard hover={false} className="p-4 bg-neon-red/10 border border-neon-red/20">
          <p className="text-sm text-neon-red">Failed to load activities: {error.message}</p>
        </GlassCard>
      )}

      {/* Empty State */}
      {!isLoading && activities.length === 0 && (
        <GlassCard hover={false} className="text-center py-12">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No activity logs yet. Start scanning URLs to see results here.</p>
        </GlassCard>
      )}

      {/* Table */}
      {!isLoading && activities.length > 0 && (
        <GlassCard hover={false}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="text-xs font-mono text-muted-foreground">URL</TableHead>
                  <TableHead className="text-xs font-mono text-muted-foreground text-right">Risk Score</TableHead>
                  <TableHead className="text-xs font-mono text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs font-mono text-muted-foreground text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item, i) => {
                  const statusConfig = getStatusConfig(item.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-foreground max-w-xs truncate">{item.url}</TableCell>
                      <TableCell className="text-sm text-right">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                          <span className="font-mono text-xs">{item.risk_score}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                          <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono text-right whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}

      {/* No Results */}
      {!isLoading && activities.length > 0 && filtered.length === 0 && (
        <GlassCard hover={false} className="text-center py-8">
          <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activities match your filters.</p>
        </GlassCard>
      )}
    </div>
  );
}