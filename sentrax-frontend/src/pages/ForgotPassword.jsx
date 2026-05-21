import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch (err) {
      // Always show success - don't reveal if email exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email to receive a reset link">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-neon-green/10 flex items-center justify-center">
            <span className="text-neon-green text-xl">✓</span>
          </div>
          <p className="text-sm text-muted-foreground">
            If an account exists with that email, we've sent a password reset link.
          </p>
          <Link to="/login">
            <Button variant="outline" className="border-border/50 text-foreground rounded-xl hover:bg-muted/50">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11 font-mono text-sm" required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-11 rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
          </Button>
          <Link to="/login" className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3" /> Back to login
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}