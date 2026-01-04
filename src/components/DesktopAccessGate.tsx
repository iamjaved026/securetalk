
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { Shield, Smartphone, KeyRound, Eye, EyeOff, LoaderCircle, Copy, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

const ACCESS_KEY = 'securetalk-desktop-access-granted';

const Orb = ({ className }: { className: string }) => (
  <motion.div
    className={className}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
    transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
  />
);

export function DesktopAccessGate({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);
  const [connectionLink, setConnectionLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);

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
      
      const link = `https://securetalkbeta.vercel.app`;
      setConnectionLink(link);
      setQrCodeUrl(`https://res.cloudinary.com/dgzgnj8jy/image/upload/v1767506936/frame_aihcej.png`);
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(connectionLink);
    setCopied(true);
    toast({ title: 'Link copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
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
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-white p-4 relative overflow-hidden">
        <Orb className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <Orb className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <Shield className="mx-auto lg:mx-0 h-16 w-16 text-primary mb-6" />
            <h1 className="text-4xl font-bold font-headline mb-2">
              SecureTalk Web
            </h1>
            <p className="text-lg text-muted-foreground mb-6">Desktop Version in Development</p>
            <p className="text-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0">
              The desktop experience is currently under construction and is not feature-complete. For the best experience, please use our mobile-optimized Progressive Web App (PWA).
            </p>

            <div className="border-t border-white/20 pt-8">
              <h2 className="text-lg font-semibold mb-4">Developer Preview Access</h2>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 max-w-sm mx-auto lg:mx-0">
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10 flex flex-col items-center gap-6"
          >
              <h3 className="text-xl font-bold text-center">Open on Mobile</h3>
              {qrCodeUrl ? (
                <div className="bg-white p-4 rounded-lg">
                  <Image src={qrCodeUrl} alt="QR Code to open mobile app" width={256} height={256} />
                </div>
              ) : (
                <div className="w-64 h-64 bg-white/10 rounded-lg flex items-center justify-center">
                  <LoaderCircle className="animate-spin" />
                </div>
              )}
              <p className="text-center text-muted-foreground text-sm">Scan this code with your phone's camera to instantly open the optimized mobile version.</p>
              <div className="w-full flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                <p className="text-sm truncate text-muted-foreground flex-1 pl-2">{connectionLink}</p>
                <Button variant="secondary" onClick={handleCopyLink} className="bg-white/20 hover:bg-white/30 text-white shrink-0">
                  {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
