import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Laptop, Wifi, Router, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import GlassCard from '@/components/shared/GlassCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import axiosInstance from '@/api/axios';

const deviceIcons = {
  browser: Monitor,
  desktop: Monitor,
  laptop: Laptop,
  mobile: Smartphone,
  phone: Smartphone,
  tablet: Tablet,
  router: Router,
  iot: Wifi,
};

export default function Devices() {
  const queryClient = useQueryClient();
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('browser');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch devices
  const { data: devicesData = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await axiosInstance.get('devices/');
      console.log('Devices API Response:', response.data);
      return response.data;
    },
    staleTime: 0, // Always treat as stale to force refetch
    refetchInterval: 3000, // Auto-refetch every 3 seconds
  });

  // Auto-refetch when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refetching devices...');
        refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetch]);

  // Refetch immediately on component mount
  useEffect(() => {
    console.log('Devices component mounted, fetching devices...');
    refetch();
  }, [refetch]);

  // Register device mutation
  const registerDeviceMutation = useMutation({
    mutationFn: async (device) => {
      const response = await axiosInstance.post('devices/register/', device);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
      setNewDeviceName('');
      setNewDeviceType('browser');
      setShowRegisterForm(false);
    },
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId) => {
      const response = await axiosInstance.delete(`devices/${deviceId}/delete/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['devices']);
    },
  });

  const devices = devicesData.devices || [];

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    if (newDeviceName.trim()) {
      registerDeviceMutation.mutate({
        name: newDeviceName,
        device_type: newDeviceType,
      });
    }
  };

  const handleRefreshDevices = async () => {
    setIsRefreshing(true);
    try {
      console.log('Refreshing devices list...');
      await refetch();
      console.log('Devices refreshed successfully');
    } catch (err) {
      console.error('Error refreshing devices:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Devices</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage all connected devices ({devices.length} device{devices.length !== 1 ? 's' : ''})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefreshDevices}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          </div>
        </div>
      </motion.div>

      {/* Register Form */}
      {showRegisterForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
        >
          <form onSubmit={handleRegisterDevice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g., Chrome Browser, iPhone 15"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Device Type
              </label>
              <select
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="browser">Browser</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
                <option value="router">Router</option>
                <option value="iot">IoT Device</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={registerDeviceMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
              >
                {registerDeviceMutation.isPending ? 'Adding...' : 'Add Device'}
              </button>
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500">Error loading devices</h3>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
            <details className="mt-2 text-xs text-muted-foreground">
              <summary className="cursor-pointer">Debug Info</summary>
              <pre className="mt-1 bg-background/50 p-2 rounded overflow-auto max-h-48">
                {JSON.stringify({ devicesData, error: error?.message, devicesCount: devices.length }, null, 2)}
              </pre>
            </details>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Devices Grid */}
      {!isLoading && devices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device, i) => {
            const Icon = deviceIcons[device.device_type] || Monitor;
            const glowMap = { secure: 'green', risk: 'red' };
            const timeAgo = formatDistanceToNow(new Date(device.last_active), { addSuffix: true });

            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard glow={glowMap[device.status] || 'blue'}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={device.status === 'secure' ? 'safe' : 'dangerous'} />
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${device.name}"?`)) {
                            deleteDeviceMutation.mutate(device.id);
                          }
                        }}
                        disabled={deleteDeviceMutation.isPending}
                        className="p-1 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground">{device.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {device.device_type.replace('_', ' ')}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Status:</span>
                      <span className="text-xs font-semibold capitalize">
                        {device.status === 'secure' ? (
                          <span className="text-green-500">✓ Secure</span>
                        ) : (
                          <span className="text-red-500">⚠ At Risk</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Active:</span>
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Added:</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(device.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && devices.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Monitor className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No devices registered</h3>
          <p className="text-muted-foreground mb-6">
            Start by registering a device to track your security status
          </p>
          <button
            onClick={() => setShowRegisterForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register Your First Device
          </button>
        </motion.div>
      )}
    </div>
  );
}