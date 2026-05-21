import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import settingsService from '@/api/settings';
import { User, Bell, Shield, CreditCard, Save, Loader2, Check, X, Eye, EyeOff, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassCard from '@/components/shared/GlassCard';
import axiosInstance from '@/api/axios';

export default function SettingsPage() {
  // ========================
  // STATE MANAGEMENT
  // ========================
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Profile Settings State
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    profile_image: null,
    profile_image_preview: null,
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Privacy Settings State
  const [privacyData, setPrivacyData] = useState({
    notifications_enabled: true,
  });
  const [privacySaving, setPrivacySaving] = useState(false);

  // ========================
  // FETCH SETTINGS ON MOUNT
  // ========================
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettings();
      
      setSettings(response);
      
      // Initialize profile data
      setProfileData({
        username: response.username || '',
        email: response.email || '',
        profile_image: null,
        profile_image_preview: response.profile_image_url || null,
      });

      // Initialize privacy data
      setPrivacyData({
        notifications_enabled: response.notifications_enabled,
      });

      // Update stored user in localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.username = response.username;
        user.email = response.email;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // ========================
  // PROFILE HANDLERS
  // ========================
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile image must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          profile_image: file,
          profile_image_preview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      setError(null);

      const data = {};
      if (profileData.username !== settings.username) {
        data.username = profileData.username;
      }
      if (profileData.email !== settings.email) {
        data.email = profileData.email;
      }
      if (profileData.profile_image) {
        data.profile_image = profileData.profile_image;
      }

      if (Object.keys(data).length === 0) {
        setError('No changes to save');
        setProfileSaving(false);
        return;
      }

      const response = await settingsService.updateProfile(data);
      setSettings(response.user);
      setProfileData((prev) => ({
        ...prev,
        profile_image: null,
        profile_image_preview: response.user.profile_image_url,
      }));

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Update stored user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.username = response.user.username;
        user.email = response.user.email;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRemoveProfileImage = async () => {
    try {
      setProfileSaving(true);
      const response = await settingsService.updateProfile({ profile_image: null });
      setSettings(response.user);
      setProfileData((prev) => ({
        ...prev,
        profile_image: null,
        profile_image_preview: null,
      }));
      setSuccessMessage('Profile image removed!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove image');
    } finally {
      setProfileSaving(false);
    }
  };

  // ========================
  // PASSWORD HANDLERS
  // ========================
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError(null);
  };

  const validatePasswords = () => {
    if (!passwordData.old_password) {
      setPasswordError('Old password is required');
      return false;
    }
    if (!passwordData.new_password) {
      setPasswordError('New password is required');
      return false;
    }
    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return false;
    }
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (passwordData.old_password === passwordData.new_password) {
      setPasswordError('New password must be different from old password');
      return false;
    }
    return true;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswords()) {
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError(null);

      await settingsService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        new_password_confirm: passwordData.new_password_confirm,
      });

      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });

      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  // ========================
  // PRIVACY HANDLERS
  // ========================
  const handlePrivacyToggle = async (value) => {
    try {
      setPrivacySaving(true);
      const response = await settingsService.updatePrivacy({
        notifications_enabled: value,
      });

      setPrivacyData(response.settings);
      setSettings((prev) => ({
        ...prev,
        notifications_enabled: value,
      }));

      setSuccessMessage('Privacy settings updated!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update privacy settings');
      setPrivacyData((prev) => ({
        ...prev,
        notifications_enabled: !value,
      }));
    } finally {
      setPrivacySaving(false);
    }
  };

  // ========================
  // RENDER
  // ========================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neon-blue" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const initials = settings?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Global Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
        >
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-500">Error</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3"
        >
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-500">Success</h3>
            <p className="text-sm text-muted-foreground mt-1">{successMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="glass border border-border/30 p-1 w-full">
          <TabsTrigger value="profile" className="data-[state=active]:bg-muted/50 data-[state=active]:text-foreground text-xs flex-1">
            <User className="w-3.5 h-3.5 mr-1.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-muted/50 data-[state=active]:text-foreground text-xs flex-1">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Password
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-muted/50 data-[state=active]:text-foreground text-xs flex-1">
            <Bell className="w-3.5 h-3.5 mr-1.5" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-muted/50 data-[state=active]:text-foreground text-xs flex-1">
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-foreground mb-6">Profile Information</h3>

              {/* Profile Picture Section */}
              <div className="mb-8">
                <Label className="text-sm font-medium text-foreground mb-4 block">Profile Picture</Label>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-green flex items-center justify-center text-2xl font-bold text-background overflow-hidden">
                      {profileData.profile_image_preview ? (
                        <img src={profileData.profile_image_preview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-border/50 text-foreground rounded-lg hover:bg-muted/50"
                          disabled={profileSaving}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                          disabled={profileSaving}
                        />
                      </label>
                      {profileData.profile_image_preview && (
                        <Button
                          variant="outline"
                          className="border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg"
                          onClick={handleRemoveProfileImage}
                          disabled={profileSaving}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Username and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-foreground">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileInputChange}
                    className="bg-muted/30 border-border/30 h-10 rounded-lg"
                    placeholder="Enter username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileInputChange}
                    className="bg-muted/30 border-border/30 h-10 rounded-lg"
                    placeholder="Enter email"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleProfileSave}
                className="bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-10 rounded-lg w-full"
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile Changes
                  </>
                )}
              </Button>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* PASSWORD TAB */}
        <TabsContent value="password">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-foreground mb-6">Change Password</h3>

              {passwordError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-6 flex items-start gap-2">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-500">{passwordError}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Old Password */}
                <div className="space-y-2">
                  <Label htmlFor="old_password" className="text-sm font-medium text-foreground">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="old_password"
                      name="old_password"
                      type={showPasswords.old ? 'text' : 'password'}
                      value={passwordData.old_password}
                      onChange={handlePasswordInputChange}
                      className="bg-muted/30 border-border/30 h-10 rounded-lg pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          old: !prev.old,
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={handlePasswordInputChange}
                      className="bg-muted/30 border-border/30 h-10 rounded-lg pr-10"
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <button
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          new: !prev.new,
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="new_password_confirm" className="text-sm font-medium text-foreground">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password_confirm"
                      name="new_password_confirm"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.new_password_confirm}
                      onChange={handlePasswordInputChange}
                      className="bg-muted/30 border-border/30 h-10 rounded-lg pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          confirm: !prev.confirm,
                        }))
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="p-3 bg-muted/20 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Password requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Minimum 8 characters</li>
                    <li>• Different from current password</li>
                    <li>• Both new password fields must match</li>
                  </ul>
                </div>

                {/* Change Password Button */}
                <Button
                  onClick={handlePasswordChange}
                  className="bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-10 rounded-lg w-full"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* PRIVACY TAB */}
        <TabsContent value="privacy">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-foreground mb-6">Privacy & Notifications</h3>

              <div className="space-y-4">
                {/* Notifications Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable Notifications</p>
                    <p className="text-xs text-muted-foreground mt-1">Receive alerts about suspicious activities and threats</p>
                  </div>
                  <Switch
                    checked={privacyData.notifications_enabled}
                    onCheckedChange={handlePrivacyToggle}
                    disabled={privacySaving}
                  />
                </div>

                {/* Privacy Info */}
                <div className="p-4 rounded-lg bg-neon-blue/5 border border-neon-blue/20">
                  <p className="text-sm text-foreground font-medium mb-2">🔒 Your Privacy</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Your data is encrypted and secure</li>
                    <li>• We never sell your personal information</li>
                    <li>• You can disable notifications anytime</li>
                    <li>• All activity logs are stored securely</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard hover={false} glow="blue">
              <h3 className="text-lg font-semibold text-foreground mb-6">Billing & Subscription</h3>

              {/* Current Plan */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-neon-blue/10 to-neon-green/10 border border-neon-blue/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">Free Plan</p>
                    <p className="text-xs text-muted-foreground mt-1">Up to 5 devices, basic protection</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">$0</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/20">
                  <p className="text-sm font-medium text-foreground mb-2">✓ Included Features</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 5 Devices</li>
                    <li>• URL Protection</li>
                    <li>• Basic Analytics</li>
                    <li>• Email Support</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-muted/20">
                  <p className="text-sm font-medium text-foreground mb-2">📊 Upgrade to Pro</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Unlimited Devices</li>
                    <li>• Family Controls</li>
                    <li>• Advanced Analytics</li>
                    <li>• Priority Support</li>
                  </ul>
                </div>
              </div>

              {/* Upgrade Button */}
              <Button className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-10 rounded-lg">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade to Pro - $9.99/month
              </Button>

              {/* Billing Info */}
              <div className="mt-6 p-4 rounded-lg bg-muted/20 border border-border/20">
                <p className="text-xs text-muted-foreground">
                  💳 No credit card required to use the Free Plan. You can upgrade anytime and cancel your subscription at any moment.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}