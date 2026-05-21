import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import authService from '@/api/auth';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.registerUser({
        username,
        email,
        password,
        password2,
        role,
      });
      // Redirect to login on successful registration
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' } 
      });
    } catch (err) {
      const errorMessage = typeof err === 'string' 
        ? err 
        : err?.email?.[0] || err?.username?.[0] || err?.password?.[0] || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start protecting your network today">
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm text-muted-foreground">Username</Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11 font-mono text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11 font-mono text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password2" className="text-sm text-muted-foreground">Confirm Password</Label>
          <Input
            id="password2"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="••••••••"
            className="bg-muted/50 border-border/50 focus:border-neon-blue/50 h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm text-muted-foreground">Account Type</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-muted/50 border border-border/50 focus:border-neon-blue/50 h-11 w-full px-3 rounded-md text-sm"
          >
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-neon-blue to-neon-green text-background font-semibold h-11 rounded-xl hover:opacity-90"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-neon-blue hover:text-neon-blue/80 transition-colors font-medium">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
}