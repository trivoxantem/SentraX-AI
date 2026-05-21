import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import familyService from '@/api/family';
import authService from '@/api/auth';
import { motion } from 'framer-motion';
import { Users, Plus, User, Loader2, X, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GlassCard from '@/components/shared/GlassCard';

export default function Family() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreateFamily, setIsCreateFamily] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [childUsername, setChildUsername] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const queryClient = useQueryClient();

  // Get current user
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => authService.getUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch family members
  const { data: familyData = { count: 0, family_name: '', members: [] }, isLoading: isLoadingFamily } = useQuery({
    queryKey: ['family-members'],
    queryFn: () => familyService.getFamilyMembers(),
    enabled: !!userData?.id,
    staleTime: 1000 * 60, // 1 minute
  });

  // Fetch child activity when modal opens
  const { data: childActivityData = { child_username: '', count: 0, activities: [] }, isLoading: isLoadingChildActivity } = useQuery({
    queryKey: ['child-activity', selectedChildId],
    queryFn: () => familyService.getChildActivity(selectedChildId),
    enabled: !!selectedChildId,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Create family mutation
  const createFamilyMutation = useMutation({
    mutationFn: (name) => familyService.createFamily(name),
    onSuccess: (data) => {
      console.log('Family created:', data);
      setFamilyName('');
      setDialogOpen(false);
      setIsCreateFamily(false);
      setSuccessMessage('Family created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Invalidate queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
    onError: (error) => {
      console.error('Error creating family:', error);
      setErrorMessage(error.response?.data?.error || error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  // Add child mutation
  const addChildMutation = useMutation({
    mutationFn: ({ username, password }) => familyService.addChild(username, password),
    onSuccess: (data) => {
      console.log('Child added:', data);
      setChildUsername('');
      setChildPassword('');
      setDialogOpen(false);
      setIsCreateFamily(false);
      setSuccessMessage(`Child "${data.child.username}" added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      // Invalidate query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
    onError: (error) => {
      console.error('Error adding child:', error);
      setErrorMessage(error.response?.data?.error || error.message);
      setTimeout(() => setErrorMessage(''), 3000);
    },
  });

  const handleCreateFamily = (e) => {
    e.preventDefault();
    if (!familyName.trim()) {
      setErrorMessage('Family name is required');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    createFamilyMutation.mutate(familyName.trim());
  };

  const handleAddChild = (e) => {
    e.preventDefault();
    if (!childUsername.trim() || !childPassword.trim()) {
      setErrorMessage('Username and password are required');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    addChildMutation.mutate({ username: childUsername, password: childPassword });
  };

  const isParent = userData?.role === 'parent';
  const hasFamily = userData?.family || familyData.count > 0;

  // Debug logging
  console.log('Family Page Debug:', {
    isParent,
    hasFamily,
    userRole: userData?.role,
    familyMembers: familyData.members?.length || 0,
    childCount: familyData.members?.filter(m => m.role === 'child').length || 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Family Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isParent ? 'Manage your family members and parental controls' : 'View your family members'}
          </p>
        </div>

        {!isLoadingUser && isParent && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setIsCreateFamily(!hasFamily);
                  setErrorMessage('');
                }}
                className="bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                {hasFamily ? 'Add Child' : 'Create Family'}
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50 sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isCreateFamily ? 'Create Your Family' : 'Add Child to Family'}</DialogTitle>
              </DialogHeader>
              {isCreateFamily ? (
                <form onSubmit={handleCreateFamily} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Family Name</Label>
                    <Input
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="e.g. The Johnsons"
                      className="bg-muted/30 border-border/30 h-10"
                      disabled={createFamilyMutation.isPending}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createFamilyMutation.isPending}
                    className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-10 rounded-xl"
                  >
                    {createFamilyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Family
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleAddChild} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Username</Label>
                    <Input
                      value={childUsername}
                      onChange={(e) => setChildUsername(e.target.value)}
                      placeholder="Enter username"
                      className="bg-muted/30 border-border/30 h-10"
                      disabled={addChildMutation.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Password</Label>
                    <Input
                      value={childPassword}
                      onChange={(e) => setChildPassword(e.target.value)}
                      type="password"
                      placeholder="Enter password (min 8 chars)"
                      className="bg-muted/30 border-border/30 h-10"
                      disabled={addChildMutation.isPending}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={addChildMutation.isPending}
                    className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-10 rounded-xl"
                  >
                    {addChildMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Child
                      </>
                    )}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        )}
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
          <p className="text-sm text-neon-green">{successMessage}</p>
        </motion.div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-neon-red flex-shrink-0" />
          <p className="text-sm text-neon-red">{errorMessage}</p>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoadingFamily && (
        <GlassCard hover={false} className="text-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading family members...</p>
        </GlassCard>
      )}

      {/* Empty State - Parent with no family */}
      {!isLoadingFamily && isParent && !hasFamily && (
        <GlassCard hover={false} className="text-center py-12 border border-neon-blue/30">
          <Users className="w-12 h-12 text-neon-blue mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Family Yet</h3>
          <p className="text-sm text-muted-foreground">Click the "Create Family" button above to get started and manage your children's online activity.</p>
        </GlassCard>
      )}

      {/* Family Members Grid */}
      {!isLoadingFamily && hasFamily && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{familyData.family_name || 'Family'}</h2>
              <p className="text-sm text-muted-foreground mt-1">{familyData.count || 0} member{familyData.count !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {familyData.members && familyData.members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyData.members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-blue to-neon-green flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground">{member.username}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20">
                        <span className="text-xs font-mono text-neon-blue capitalize">{member.role}</span>
                      </div>
                    </div>
                    {member.role === 'child' && isParent && (
                      <Button
                        onClick={() => {
                          console.log('Opening activity for child:', member.id);
                          setSelectedChildId(member.id);
                          setShowActivityModal(true);
                        }}
                        size="sm"
                        className="px-4 py-2 bg-gradient-to-r from-neon-blue to-cyan-400 text-white hover:opacity-90 rounded-lg flex-shrink-0 font-semibold shadow-lg"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Activity
                      </Button>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard hover={false} className="text-center py-8">
              <p className="text-sm text-muted-foreground">Family created! Click "Add Child" to add members.</p>
            </GlassCard>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoadingFamily && !hasFamily && !isParent && (
        <GlassCard hover={false} className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Your parent hasn't set up a family yet.</p>
        </GlassCard>
      )}

      {/* Child Activity Modal */}
      {showActivityModal && (
        <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
          <DialogContent className="glass border-border/50 sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{childActivityData.child_username}'s Activity</DialogTitle>
            </DialogHeader>

            {isLoadingChildActivity ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : childActivityData.count === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {childActivityData.activities.map((activity, i) => {
                  const statusColor = {
                    safe: 'bg-neon-green/10 text-neon-green',
                    suspicious: 'bg-yellow-500/10 text-yellow-500',
                    dangerous: 'bg-red-500/10 text-red-500',
                  }[activity.status] || 'bg-gray-500/10 text-gray-500';

                  const isBlockedByParent = activity.reason === 'Blocked by parent';

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border transition-colors ${isBlockedByParent ? 'bg-red-500/5 border-red-500/50' : 'border-border/30 hover:border-neon-blue/50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-muted-foreground truncate">{activity.url}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                              {activity.status.toUpperCase()}
                            </span>
                            {isBlockedByParent && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                🚫 Blocked by Parent
                              </span>
                            )}
                            {activity.reason && !isBlockedByParent && (
                              <span className="text-xs text-muted-foreground italic">
                                {activity.reason}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">Risk: {activity.risk_score}%</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}