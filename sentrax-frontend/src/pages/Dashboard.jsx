import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, Monitor, Activity, LogOut, Loader2, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import GlassCard from '@/components/shared/GlassCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import authService from '@/api/auth';
import dashboardService from '@/api/dashboard';
import alertsService from '@/api/alerts';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getUser();
        setUser(userData);
      } catch (err) {
        const storedUser = authService.getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          setError('Failed to load user profile');
          navigate('/login');
        }
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Fetch dashboard data
  const { data: dashboardData = null, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: () => dashboardService.getDashboardData(),
    enabled: !!user, // Only fetch when user is loaded
    staleTime: 0, // Always treat as stale
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Fetch alerts (only for parents)
  const { data: alertsData = { count: 0, unread_count: 0, alerts: [] }, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsService.getAlerts(),
    enabled: !!user && user.role === 'parent', // Only fetch for parents
    staleTime: 0, // Always treat as stale
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  // Mutation to mark alert as read
  const markAsReadMutation = useMutation({
    mutationFn: (alertId) => alertsService.markAsRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const handleLogout = async () => {
    try {
      await authService.logoutUser();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  // Get status color for recent activity
  const getStatusColor = (status) => {
    switch (status) {
      case 'safe':
        return 'text-neon-green';
      case 'suspicious':
        return 'text-yellow-400';
      case 'dangerous':
        return 'text-neon-red';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, <span className="text-neon-blue font-semibold">{user?.username}</span> 
            {user?.role && ` (${user.role})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-green/20 bg-neon-green/5">
            <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
            <span className="text-xs font-mono text-neon-green">All Systems Operational</span>
          </div>
          
          {/* Alerts Badge (Parents Only) */}
          {user?.role === 'parent' && alertsData.unread_count > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-red/20 bg-neon-red/5 animate-pulse">
              <Bell className="w-4 h-4 text-neon-red" />
              <span className="text-xs font-semibold text-neon-red">{alertsData.unread_count} Alert{alertsData.unread_count !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="border-border/50 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoadingDashboard ? (
        <GlassCard hover={false} className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </GlassCard>
      ) : dashboardError ? (
        <GlassCard hover={false} className="p-4 bg-neon-red/10 border border-neon-red/20">
          <p className="text-sm text-neon-red">Failed to load dashboard data</p>
        </GlassCard>
      ) : dashboardData ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <StatsCard 
                title="Safety Score" 
                value={dashboardData.safety_score} 
                suffix="%" 
                icon={ShieldCheck} 
                glow="green" 
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatsCard 
                title="Threats Blocked" 
                value={dashboardData.threats_blocked} 
                icon={ShieldAlert} 
                glow="red" 
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatsCard 
                title="Total Scans" 
                value={dashboardData.total_scans} 
                icon={Monitor} 
                glow="blue" 
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <StatsCard 
                title="Safe Sites" 
                value={dashboardData.safe_sites} 
                icon={Activity} 
                glow="purple" 
              />
            </motion.div>
          </div>

          {/* Recent Activity Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <GlassCard hover={false}>
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
              
              {dashboardData.recent_activity && dashboardData.recent_activity.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30 hover:bg-transparent">
                        <TableHead className="text-xs font-mono text-muted-foreground">URL</TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground text-right">Risk Score</TableHead>
                        <TableHead className="text-xs font-mono text-muted-foreground text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.recent_activity.map((activity, i) => (
                        <motion.tr
                          key={activity.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-border/20 hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="font-mono text-sm text-foreground max-w-xs truncate">
                            {activity.url}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold capitalize ${getStatusColor(activity.status)}`}>
                              {activity.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-right">
                            <span className="font-mono">{activity.risk_score}%</span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono text-right">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No activity yet. Start scanning URLs to see results here.</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Alerts Section (Parents Only) */}
          {user?.role === 'parent' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard hover={false}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-neon-red" />
                    <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
                    {alertsData.unread_count > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-neon-red/20 border border-neon-red/30">
                        <span className="text-xs font-semibold text-neon-red">{alertsData.unread_count} unread</span>
                      </span>
                    )}
                  </div>
                </div>

                {isLoadingAlerts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                  </div>
                ) : alertsData.alerts && alertsData.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {alertsData.alerts.slice(0, 5).map((alert, i) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          alert.is_read 
                            ? 'border-border/20 bg-transparent hover:bg-muted/20' 
                            : 'border-neon-red/30 bg-neon-red/10 hover:bg-neon-red/15'
                        }`}
                        onClick={() => !alert.is_read && markAsReadMutation.mutate(alert.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                            <p className="text-xs font-mono text-muted-foreground truncate mt-1">{alert.url}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              From: <span className="font-semibold text-neon-blue">{alert.child_username}</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </p>
                            {!alert.is_read && (
                              <span className="inline-block w-2 h-2 bg-neon-red rounded-full mt-2"></span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No alerts. All children are safe! ✅</p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
}