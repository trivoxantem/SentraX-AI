import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ResetPassword() {
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: password });
      window.location.href = '/login';
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
        )}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">New Password</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11" required />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Confirm Password</Label>
          <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11" required />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-11 rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
        </Button>
      </form>
    </AuthLayout>
  );
}