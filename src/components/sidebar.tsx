
'use client'

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link'
import {
  User,
  Settings,
  Info,
  Heart,
  MessageSquareWarning,
  Code,
  Users,
  BadgeCheck,
  Shield,
  LogOut,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { ComingSoonDialog } from './coming-soon-dialog';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { AppContext } from '@/app/(app)/layout'; // Import the context
import { cn } from '@/lib/utils';

type SidebarProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setAvatarPreview, isAvatarPreviewOpen } = useContext(AppContext);
  const { firestore, auth, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc(userDocRef);

  const menuItems = [
    { icon: User, label: 'My Profile', href: '/profile', show: true },
    { icon: Users, label: 'Connections', href: '/connections', show: true },
    { icon: Settings, label: 'Settings', href: '/settings', show: true },
    { icon: Info, label: 'About Us', href: '/about', show: true },
    { icon: Heart, label: 'Support Us', href: '/support', show: true },
    { icon: Shield, label: 'Admin', href: '/admin', show: userProfile?.verified },
  ]
  
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userProfile?.profilePictureUrl) {
      setAvatarPreview({ avatarUrl: userProfile.profilePictureUrl, name: userProfile.name });
    }
  };
  
  const handleLogout = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        toast({ title: "Signed Out", description: "You have been successfully signed out." });
        router.push('/chats'); // Redirect to a public page after sign-out
        onOpenChange(false);
    } catch (error) {
        console.error("Sign out error:", error);
        toast({ variant: 'destructive', title: 'Sign Out Failed' });
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="p-0 flex flex-col bg-card"
      >
        <SheetHeader>
          <SheetTitle className="sr-only">User Menu</SheetTitle>
          <SheetDescription className="sr-only">A menu with user profile, settings, and other options.</SheetDescription>
        </SheetHeader>
        <div className="p-6 text-center bg-muted rounded-b-2xl shadow-inner">
            <button onClick={handleAvatarClick} className="mx-auto">
                <Avatar className="h-20 w-20 mx-auto mb-4 border-2 border-white/50">
                    <AvatarImage src={userProfile?.profilePictureUrl} alt={userProfile?.name} data-ai-hint="person portrait"/>
                    <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
            </button>
             <div className="flex items-center justify-center gap-2">
                <p className="font-bold text-xl drop-shadow-sm text-foreground">{userProfile?.name || 'User'}</p>
                {userProfile?.verified && <BadgeCheck className="h-6 w-6 text-primary drop-shadow-sm" />}
              </div>
              {userProfile?.verified && (
                  <Badge variant="outline" className="mt-2 border-primary/50 text-primary font-semibold">
                    <Shield className="mr-2 h-4 w-4" />
                    Secure Talk Developer
                  </Badge>
              )}
        </div>
        <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
            {menuItems.map((item) => (
                item.show && (
                    item.href ? (
                        <Link key={item.label} href={item.href} className="flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground/80" onClick={() => onOpenChange(false)}>
                            <item.icon className="h-6 w-6 mr-4 text-primary" />
                            <span className="flex-1 font-medium">{item.label}</span>
                        </Link>
                    ) : (
                         <button key={item.label} className={cn("flex items-center p-3 rounded-lg hover:bg-accent transition-colors text-foreground/80 w-full", item.label === 'Sign Out' && 'text-destructive')}>
                            <item.icon className={cn("h-6 w-6 mr-4", item.label === 'Sign Out' ? 'text-destructive' : 'text-primary')} />
                            <span className="flex-1 font-medium text-left">{item.label}</span>
                        </button>
                    )
                )
            ))}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
    <ComingSoonDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
