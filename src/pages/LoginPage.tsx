import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, KeyRound, LogIn, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SurfaceCard from '@/components/SurfaceCard';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(74,118,255,0.28),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(31,80,211,0.2),transparent_40%)]" />
          {[...Array(7)].map((_, idx) => (
            <motion.div
              key={idx}
              className="absolute rounded-full bg-blue-300/10"
              style={{
                width: `${32 + idx * 18}px`,
                height: `${32 + idx * 18}px`,
                top: `${12 + idx * 10}%`,
                left: `${(idx % 4) * 22 + 4}%`,
              }}
              animate={{ y: [0, -18, 0], x: [0, idx % 2 === 0 ? 10 : -10, 0] }}
              transition={{ duration: 5 + idx, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          <div className="relative z-10">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-200">
              <Box className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Inventory Operations Hub</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Plan stock, manage production, and monitor dispatch with one modern workflow.
            </p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur">
            Secure enterprise workspace for stores, production, QA, and commercial teams.
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600">Sign in to continue to your inventory workspace.</p>
            </div>

            <SurfaceCard className="space-y-6" padding="lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="admin@erp.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? 'Signing in...' : 'Log in'}
                </Button>
              </form>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick demo access</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button variant="outline" size="sm" onClick={() => fillDemo('admin@erp.com', 'admin123')}>Admin</Button>
                  <Button variant="outline" size="sm" onClick={() => fillDemo('manager@erp.com', 'manager123')}>Manager</Button>
                  <Button variant="outline" size="sm" onClick={() => fillDemo('staff@erp.com', 'staff123')}>Staff</Button>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </div>
  );
}
