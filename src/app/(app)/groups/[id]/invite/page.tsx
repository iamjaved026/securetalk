
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Copy, Share2, Send, Check, UserPlus, Search, LoaderCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, serverTimestamp } from 'firebase/firestore';
import type { Contact, Group } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function GroupInvitePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { user, firestore } = useFirebase();

  const groupId = params.id as string;
  const groupDocRef = useMemoFirebase(() => {
      if(!firestore || !groupId) return null;
      return doc(firestore, 'groups', groupId)
  }, [firestore, groupId]);
  const { data: group, isLoading: isGroupLoading } = useDoc<Group>(groupDocRef);

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'contacts'));
  }, [firestore, user]);
  const { data: contacts, isLoading: areContactsLoading } = useCollection<Contact>(contactsQuery);

  const [inviteLink, setInviteLink] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (groupId) {
      setInviteLink(`${window.location.origin}/groups/join?id=${groupId}`);
    }
  }, [groupId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: 'Invite link copied!' });
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join my group on Secure Talk: ${group?.name}`,
        text: `Join "${group?.name}" on Secure Talk using this link.`,
        url: inviteLink,
      }).catch(err => console.error("Share failed:", err));
    } else {
      handleCopyLink();
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };
  
  const handleSendInvites = async () => {
    if (selectedContacts.length === 0 || !user || !group) return;

    setIsSending(true);
    
    const inviteMessage = `[GROUP_INVITE]\n${JSON.stringify({
        groupId: group.id,
        groupName: group.name,
        groupAvatar: group.avatar,
    })}`;

    const promises = selectedContacts.map(contactId => {
        const chatId = [user.uid, contactId].sort().join('_');
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');
        const messageData = {
            senderId: user.uid,
            text: inviteMessage,
            timestamp: serverTimestamp(),
        };
        addDocumentNonBlocking(messagesRef, messageData);

        // Update last message timestamp for the sender's contact entry
        const userContactRef = doc(firestore, 'users', user.uid, 'contacts', contactId);
        return setDocumentNonBlocking(userContactRef, { lastMessageTimestamp: serverTimestamp() }, { merge: true });
    });

    await Promise.all(promises);

    setIsSending(false);
    toast({
        title: 'Invites Sent!',
        description: `Invites have been sent to ${selectedContacts.length} contact(s).`,
    });
    setSelectedContacts([]);
  };
  
  const filteredContacts = contacts?.filter(c => 
    !c.isGroup && ((c.displayName || c.name) || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isGroupLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/chats/group_${groupId}`}>
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Done</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Invite to Group</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <Card>
            <CardHeader className="items-center text-center">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={group?.avatar} alt={group?.name} />
                    <AvatarFallback><Users /></AvatarFallback>
                </Avatar>
                <CardTitle>{group?.name || 'Loading group...'}</CardTitle>
                <CardDescription>Group created successfully. Now, invite people!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Share Invite Link</Label>
                    <div className="flex items-center gap-2 p-2 mt-1 bg-muted rounded-lg">
                        <Input readOnly value={inviteLink} className="bg-transparent border-0" />
                        <Button variant="ghost" size="icon" onClick={handleCopyLink}><Copy className="w-5 w-5"/></Button>
                        <Button size="icon" onClick={handleShare}><Share2 className="w-5 w-5"/></Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Invite from Contacts</CardTitle>
                <div className="relative pt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search contacts..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    {areContactsLoading ? (
                        <div className="flex justify-center items-center h-full"><LoaderCircle className="animate-spin" /></div>
                    ) : filteredContacts && filteredContacts.length > 0 ? (
                        <div className="space-y-2">
                            {filteredContacts.map(contact => (
                                <div
                                  key={contact.id}
                                  role="button"
                                  aria-pressed={selectedContacts.includes(contact.id)}
                                  onClick={() => toggleContactSelection(contact.id)}
                                  className={cn("w-full flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent", selectedContacts.includes(contact.id) && "bg-accent")}
                                >
                                  <Avatar className="h-10 w-10 pointer-events-none">
                                    <AvatarImage src={contact.avatar} alt={contact.displayName || contact.name} />
                                    <AvatarFallback>{(contact.displayName || contact.name || '?').charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="flex-1 text-left font-medium pointer-events-none">{contact.displayName || contact.name}</span>
                                  <Checkbox checked={selectedContacts.includes(contact.id)} readOnly />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>No contacts found.</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
      <footer className="p-4 border-t bg-card shrink-0">
        <Button onClick={handleSendInvites} className="w-full" disabled={selectedContacts.length === 0 || isSending}>
            {isSending ? <LoaderCircle className="mr-2 animate-spin" /> : <Send className="mr-2" />}
            {isSending ? 'Sending...' : `Send Invite${selectedContacts.length > 1 ? 's' : ''} (${selectedContacts.length})`}
        </Button>
      </footer>
    </div>
  );
}
