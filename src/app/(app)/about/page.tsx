
'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle, Shield, Zap, Heart, User, Sparkles, XCircle, DollarSign, Server, LoaderCircle, Construction, BadgeCheck, Users as UsersIcon, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ComingSoonDialog } from '@/components/coming-soon-dialog';
import React, { useState, useCallback } from 'react';
import type { Contact } from '@/lib/types';
import { DeveloperDetailSheet } from '@/components/developer-detail-sheet';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, collection, setDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';


export default function AboutUsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { firestore, user: currentUser, userProfile } = useFirebase();

  const teamQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'team');
  }, [firestore]);

  const { data: team, isLoading: isTeamLoading } = useCollection<Contact>(teamQuery);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<Contact | null>(null);

  const corePrinciples = [
    { 
      icon: DollarSign, 
      title: 'Completely Free', 
      description: 'Secure Talk is free to use. No hidden costs, no premium-only features for core communication.' 
    },
    { 
      icon: XCircle, 
      title: 'No Ads, No Data Selling', 
      description: 'We respect your attention and privacy. We will never show you ads or sell your data to third parties.' 
    },
    { 
      icon: Shield, 
      title: 'True End-to-End Encryption', 
      description: 'Your conversations are private. All messages and calls are end-to-end encrypted. No one outside of your chat, not even us, can read or listen to them.' 
    },
    { 
      icon: Server, 
      title: 'Ephemeral Server Data', 
      description: 'Encrypted messages immediately vanish from our servers the moment they reach their destination. We store nothing.' 
    },
  ];

  const handleConnect = useCallback(async (devToConnect: Contact) => {
    if (!firestore || !currentUser || !userProfile) {
        toast({ variant: 'destructive', title: 'Could not connect', description: 'You must be logged in to connect.' });
        return;
    }
    
    const currentTimestamp = serverTimestamp();

    // 1. Add dev to user's contact list
    const userContactRef = doc(firestore, 'users', currentUser.uid, 'contacts', devToConnect.id);
    await setDoc(userContactRef, {
        id: devToConnect.id,
        name: devToConnect.name,
        avatar: devToConnect.profilePictureUrl || devToConnect.avatar,
        bio: devToConnect.bio,
        language: devToConnect.language || 'en',
        verified: devToConnect.verified,
        lastMessageTimestamp: currentTimestamp,
    }, { merge: true });

    // 2. Add user to dev's contact list
    const devContactRef = doc(firestore, 'users', devToConnect.id, 'contacts', currentUser.uid);
    await setDoc(devContactRef, {
        id: currentUser.uid,
        name: userProfile.name,
        avatar: userProfile.profilePictureUrl,
        bio: userProfile.bio,
        language: userProfile.language || 'en',
        verified: userProfile.verified || false,
        lastMessageTimestamp: currentTimestamp,
    }, { merge: true });
    
    // 3. Trigger realtime update for the dev to see the new chat
    const otherUserDocForUpdate = doc(firestore, 'users', devToConnect.id);
    await updateDoc(otherUserDocForUpdate, { lastConnection: currentUser.uid });

    toast({
        title: 'Connection Added!',
        description: `You are now connected with ${devToConnect.name}.`,
    });
    
    setSelectedDeveloper(null);
    router.push(`/chats/${devToConnect.id}`);

  }, [firestore, currentUser, userProfile, toast, router]);


  return (
    <>
      <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
        <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-6 w-6" />
              <span className="sr-only">Back to Settings</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-headline">About Us</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                      <Shield className="w-8 h-8 text-primary" />
                  </div>
              </div>
              <CardTitle className="font-headline text-3xl">Secure Talk</CardTitle>
              <CardDescription>Version 1.0.0 (Developer Preview)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Our mission is to provide a communication platform where you can connect freely and securely, without compromising on your privacy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Privacy Commitment</CardTitle>
              <CardDescription>
                  Unlike other apps that claim privacy but collect your metadata (like IP address and contacts), we believe in true privacy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {corePrinciples.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <feature.icon className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>How We Operate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                    We are funded entirely by donations from users like you. This model allows us to stay independent and focused on our privacy-first mission. Contributions help cover costs for servers, maintenance, support, and future updates.
                </p>
                <Button asChild>
                    <Link href="/support">
                        <Heart className="mr-2" />
                        Support Us
                    </Link>
                </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>App Status</CardTitle>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full justify-between" asChild>
                    <Link href="/roadmap">
                        <span>Developer Preview Details</span>
                        <Construction className="h-5 w-5" />
                    </Link>
                </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meet The Team</CardTitle>
            </CardHeader>
            <CardContent>
              {isTeamLoading ? (
                  <div className="flex items-center justify-center p-4">
                      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : team && team.length > 0 ? (
                 <div className="space-y-2">
                     {team.map((member) => (
                         <button 
                            key={member.id}
                            className="flex items-center gap-4 w-full text-left p-2 rounded-lg hover:bg-accent"
                            onClick={() => setSelectedDeveloper(member)}
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait" />
                              <AvatarFallback>{member.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{member.name}</h3>
                                {member.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                            </div>
                          </button>
                     ))}
                 </div>
              ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <UsersIcon className="mx-auto h-8 w-8 mb-2" />
                    <p>The team is working behind the scenes!</p>
                  </div>
              )}
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Have a question, suggestion, or want to contribute? We'd love to hear from you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a href="mailto:jvdhussain2008@gmail.com" className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-sm text-muted-foreground">jvdhussain2008@gmail.com</p>
                </div>
              </a>
              <a href="tel:+916207069013" className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <p className="text-sm text-muted-foreground">+91 6207069013</p>
                </div>
              </a>
            </CardContent>
          </Card>
          
          <div className="text-center text-xs text-muted-foreground pt-4">
            <p>&copy; {new Date().getFullYear()} Secure Talk. All Rights Reserved.</p>
          </div>
        </main>
      </div>
      <ComingSoonDialog open={isModalOpen} onOpenChange={setIsModalOpen} />
      {selectedDeveloper && (
        <DeveloperDetailSheet 
            open={!!selectedDeveloper}
            onOpenChange={(isOpen) => !isOpen && setSelectedDeveloper(null)}
            developer={selectedDeveloper}
            onConnect={handleConnect}
        />
      )}
    </>
  );
}
