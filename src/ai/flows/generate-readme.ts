'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronRight, User, Bell, Palette, Languages, HardDrive, Lock, Shield, Info, Heart, MessageSquareWarning, FileText, BadgeCheck, LoaderCircle, Map, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';


const SettingsItem = ({ href, icon: Icon, title }: { href: string, icon: React.ElementType, title: string }) => {
    return (
        <Link href={href} className="flex items-center p-4 hover:bg-accent/50 transition-colors">
            <Icon className="h-6 w-6 mr-4 text-muted-foreground" />
            <span className="flex-1 font-medium">{title}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
    );
};

export default function SettingsPage() {
    const { userProfile, isUserLoading } = useFirebase();

    const generalSettings = [
        { href: '/settings/account', icon: KeyRound, title: 'My Account' },
        { href: '/settings/notifications', icon: Bell, title: 'Notifications' },
        { href: '/settings/chat-customization', icon: Palette, title: 'Chat Customization' },
        { href: '/settings/translation', icon: Languages, title: 'Translation' },
        { href: '/settings/data-and-storage', icon: HardDrive, title: 'Data & Storage' },
        { href: '/settings/privacy', icon: Lock, title: 'Privacy' },
    ];

    const aboutAndSupport = [
        { href: '/about', icon: Info, title: 'About Us' },
        { href: '/support', icon: Heart, title: 'Support Us' },
        { href: '/roadmap', icon: Map, title: 'Roadmap & Status' },
        { href: '/feedback', icon: MessageSquareWarning, title: 'Report / Feedback' },
    ];

  return (
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chats">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Chats</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {isUserLoading ? (
            <div className="flex items-center justify-center p-6 bg-card rounded-lg">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <Link href="/profile" className="flex items-center gap-4 p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors">
                <Avatar className="h-14 w-14 border">
                    <AvatarImage src={userProfile?.profilePictureUrl} alt={userProfile?.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-lg truncate">{userProfile?.name}</p>
                        {userProfile?.verified && <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{userProfile?.bio}</p>
                </div>
                 <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </Link>
        )}

        <Card>
            <CardHeader>
                <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {generalSettings.map((item) => (
                        <SettingsItem key={item.title} {...item} />
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>About & Support</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {aboutAndSupport.map((item) => (
                        <SettingsItem key={item.title} {...item} />
                    ))}
                </div>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}