
'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LoaderCircle, Shield, Users, BadgeCheck, Copy, Check, Briefcase, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, serverTimestamp, orderBy, setDoc, updateDoc } from 'firebase/firestore';
import type { Contact } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AdminUserDetailSheet } from '@/components/admin-user-detail-sheet';

function UserCard({ user, onUserSelect }: { user: Contact, onUserSelect: (user: Contact) => void }) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the drawer from opening
        navigator.clipboard.writeText(user.id);
        setCopied(true);
        toast({ title: "User ID Copied!" });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onUserSelect(user)}>
            <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar || user.profilePictureUrl} alt={user.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate">{user.name}</h3>
                    {user.verified && <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <p className="truncate">
                        ID: {user.id.substring(0, 10)}...
                    </p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">Lang: {user.language || 'en'}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
  const { firestore, user: adminUser, userProfile: adminProfile } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<Contact | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, isLoading, error } = useCollection<Contact>(usersQuery);
  
  const sortedUsers = useMemo(() => {
    if (!users) return [];
    return [...users].sort((a, b) => {
      // Assuming createdAt is a Firestore Timestamp
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
      return bDate.getTime() - aDate.getTime();
    });
  }, [users]);
  

  const totalUsers = useMemo(() => users?.length || 0, [users]);

  const handleConnect = useCallback(async (userToConnect: Contact) => {
    if (!firestore || !adminUser || !adminProfile) {
        toast({ variant: 'destructive', title: 'Could not connect', description: 'Admin user data not available.' });
        return;
    }
    
    const currentTimestamp = serverTimestamp();

    // 1. Add user to admin's contact list
    const adminContactRef = doc(firestore, 'users', adminUser.uid, 'contacts', userToConnect.id);
    await setDoc(adminContactRef, {
        id: userToConnect.id,
        name: userToConnect.name,
        avatar: userToConnect.avatar || userToConnect.profilePictureUrl,
        bio: userToConnect.bio,
        language: userToConnect.language || 'en',
        verified: userToConnect.verified || false,
        liveTranslationEnabled: false,
        lastMessageTimestamp: currentTimestamp,
    }, { merge: true });

    // 2. Add admin to user's contact list
    const userContactRef = doc(firestore, 'users', userToConnect.id, 'contacts', adminUser.uid);
    await setDoc(userContactRef, {
        id: adminUser.uid,
        name: adminProfile.name,
        avatar: adminProfile.profilePictureUrl,
        bio: adminProfile.bio,
        language: adminProfile.language || 'en',
        verified: adminProfile.verified || false,
        liveTranslationEnabled: false,
        lastMessageTimestamp: currentTimestamp,
    }, { merge: true });
    
    // 3. Trigger realtime update for the other user to see the new chat
    const otherUserDocForUpdate = doc(firestore, 'users', userToConnect.id);
    await updateDoc(otherUserDocForUpdate, { lastConnection: adminUser.uid });

    toast({
        title: 'Connection Added!',
        description: `You are now connected with ${userToConnect.name}.`,
    });
    
    setSelectedUser(null);
    router.push(`/chats/${userToConnect.id}`);

  }, [firestore, adminUser, adminProfile, toast, router]);

  return (
    <>
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chats">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Chats</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold font-headline">Admin Dashboard</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{isLoading ? <LoaderCircle className="h-8 w-8 animate-spin" /> : totalUsers}</p>
          </CardContent>
        </Card>

        {adminProfile?.verified && (
            <>
            <Card>
                <CardHeader>
                    <CardTitle>App Updates</CardTitle>
                    <CardDescription>Manage and publish release notes for all users.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link href="/admin/update">
                            <Megaphone className="mr-2"/>
                            Publish Update
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Team Management</CardTitle>
                    <CardDescription>Manage users displayed on the 'About Us' page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" asChild>
                        <Link href="/admin/team">
                            <Briefcase className="mr-2"/>
                            Manage Team
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            </>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>A list of all registered users in the database.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-destructive p-4 bg-destructive/10 rounded-md text-center">
                <h3 className="font-bold">Access Denied</h3>
                <p className="text-sm">You do not have permission to view all users. Please update your Firestore Security Rules to grant admin access.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {sortedUsers.map(user => <UserCard key={user.id} user={user} onUserSelect={setSelectedUser} />)}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
    {selectedUser && (
        <AdminUserDetailSheet
            open={!!selectedUser}
            onOpenChange={(isOpen) => {
                if (!isOpen) setSelectedUser(null);
            }}
            user={selectedUser}
            onConnect={handleConnect}
        />
    )}
    </>
  );
}
