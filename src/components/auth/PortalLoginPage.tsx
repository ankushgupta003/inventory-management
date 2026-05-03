import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Box, Building2, KeyRound, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDefaultRouteForUser } from '@/lib/auth';
import { getErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SurfaceCard from '@/components/SurfaceCard';
import type { AuthPortal } from '@/types';

interface PortalLoginPageProps {
  portal: AuthPortal;
  title: string;
  description: string;
  heroTitle: string;
  heroDescription: string;
  helperLabel: string;
  helperHref: string;
  helperLinkText: string;
}

export default function PortalLoginPage({
  portal,
  title,
  description,
  heroTitle,
  heroDescription,
  helperLabel,
  helperHref,
  helperLinkText,
}: PortalLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading, user, loginCompany, loginSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={user.mustResetPassword ? '/reset-password' : getDefaultRouteForUser(user)} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const nextUser =
        portal === 'super-admin'
          ? await loginSuperAdmin(email, password)
          : await loginCompany(email, password);

      toast.success('Logged in successfully');
      navigate(nextUser.mustResetPassword ? '/reset-password' : getDefaultRouteForUser(nextUser), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const AccentIcon = portal === 'super-admin' ? ShieldCheck : Box;
  const SecondaryIcon = portal === 'super-admin' ? Building2 : Box;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(74,118,255,0.28),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.2),transparent_40%)]" />
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
              <AccentIcon className="h-6 w-6" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{heroTitle}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">{heroDescription}</p>
          </div>

          <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur">
            <div className="flex items-center gap-3">
              <SecondaryIcon className="h-5 w-5 text-emerald-300" />
              <span>{portal === 'super-admin' ? 'Provision and govern tenant companies from one secure portal.' : 'Access your company inventory workspace with your assigned account.'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>

            <SurfaceCard className="space-y-6" padding="lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`${portal}-email`}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`${portal}-email`}
                      type="email"
                      placeholder={portal === 'super-admin' ? 'owner@inventoryx.com' : 'admin@company.com'}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${portal}-password`}>Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`${portal}-password`}
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? 'Signing in...' : 'Log in'}
                </Button>
              </form>

              <p className="text-sm text-muted-foreground">
                {helperLabel}{' '}
                <a href={helperHref} className="font-medium text-primary hover:underline">
                  {helperLinkText}
                </a>
              </p>
            </SurfaceCard>
          </div>
        </div>
      </div>
    </div>
  );
}
