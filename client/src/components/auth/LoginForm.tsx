import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckSquare, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('admin@proflow.com');
  const [password, setPassword] = useState('password123');
  const { login, isLoggingIn } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password });
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
          <CheckSquare className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to ProFlow
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-slate-400 text-sm">
          Enter your credentials to access your workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
          
          <div className="rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Admin: <code className="font-mono">admin@proflow.com</code> / <code className="font-mono">password123</code></p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full h-10 font-semibold" disabled={isLoggingIn}>
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
