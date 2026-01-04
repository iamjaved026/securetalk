
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Shield, Smartphone, KeyRound, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const ACCESS_KEY = 'securetalk-desktop-access-granted';

export function DesktopAccessGate({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This effect runs only on the client-side to prevent hydration errors.
    const checkAccess = () => {
      const mediaQuery = window.matchMedia('(min-width: 1024px)');
      setIsDesktop(mediaQuery.matches);

      const storedAccess = localStorage.getItem(ACCESS_KEY);
      if (storedAccess === 'true') {
        setHasAccess(true);
      }
      setIsChecking(false);
    };

    checkAccess();

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const mediaQueryList = window.matchMedia('(min-width: 1024px)');
    mediaQueryList.addEventListener('change', handler);

    return () => mediaQueryList.removeEventListener('change', handler);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === process.env.NEXT_PUBLIC_DESKTOP_ACCESS_KEY) {
      localStorage.setItem(ACCESS_KEY, 'true');
      setHasAccess(true);
      toast({
        title: 'Access Granted',
        description: 'Welcome to the desktop preview.',
      });
    } else {
      setError('Incorrect access key.');
      setPassword('');
    }
  };
  
  if (isChecking) {
      return (
          <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white">
              <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  if (isDesktop && !hasAccess) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="w-full max-w-md text-center">
          <Shield className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="text-3xl font-bold font-headline mb-2">
            SecureTalk Web
          </h1>
            <p className="text-lg text-muted-foreground mb-8">Desktop Version in Development</p>

          <p className="text-foreground/80 mb-6">
            The desktop experience is currently under construction. For the best experience, please use our mobile-optimized Progressive Web App (PWA).
          </p>

          <Button asChild variant="outline" className="w-full mb-12 bg-transparent hover:bg-white/10 text-white">
            <Link href="https://securetalkbeta.vercel.app">
              <Smartphone className="mr-2 h-5 w-5" />
              Open on Mobile
            </Link>
          </Button>

          <div className="border-t border-white/20 pt-8">
            <h2 className="text-lg font-semibold mb-4">Developer Preview Access</h2>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter access key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white pl-10 focus:ring-primary"
                />
                 <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-white/20"
                    onClick={() => setShowPassword(!showPassword)}
                 >
                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                 </Button>
              </div>
              <Button type="submit" variant="default">
                Access Preview
              </Button>
              {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
