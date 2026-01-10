

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link';
import { MoreVertical, User, Search, Phone, Video, PhoneOutgoing, PhoneMissed, PhoneIncoming, Users, MessageSquare, Construction } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/sidebar'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CallDetailsSheet } from '@/components/call-details-sheet'
import { cn } from '@/lib/utils'
import { NavLink } from '@/components/nav-link'
import { ImagePreviewDialog } from '@/components/image-preview-dialog'
import type { ImagePreviewState } from '@/components/image-preview-dialog'
import { ClientOnly } from '@/components/client-only'
import type { Contact } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { LoaderCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComingSoonDialog } from '@/components/coming-soon-dialog';

declare global {
  interface Window {
    SecureTalkNative?: {
      send: (type: string, payload: any) => void;
    };
  }
}

function CallItem({ contact }: { contact: Contact }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const call = contact.call || {
      type: 'outgoing',
      callType: 'voice',
      timestamp: new Date()
  };

  const handleCallAgain = (e: React.MouseEvent, callType: 'voice' | 'video') => {
    e.stopPropagation();
    if (window.SecureTalkNative) {
      window.SecureTalkNative.send('START_CALL', {
        contactId: contact.id,
        contactName: contact.name,
        type: callType,
      });
    } else {
      alert('Calls are only available in the SecureTalk app.');
    }
  };
  
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    if (isToday(date)) return `Today, ${format(date, 'p')}`;
    if (isYesterday(date)) return `Yesterday, ${format(date, 'p')}`;
    return format(date, 'MMMM d, p');
  }

  const CallIcon = () => {
    const commonClass = "h-5 w-5 mr-2";
    switch(call.type) {
      case 'incoming': return <PhoneIncoming className={cn(commonClass, "text-green-500")} />;
      case 'outgoing': return <PhoneOutgoing className={cn(commonClass, "text-blue-500")} />;
      case 'missed': return <PhoneMissed className={cn(commonClass, "text-red-500")} />;
      default: return <Phone className={commonClass} />;
    }
  }

  return (
    <>
      <div className="flex items-center p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setIsSheetOpen(true)}>
        <Avatar className="h-12 w-12 mr-4">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback>{contact.name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-bold truncate">{contact.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <CallIcon />
            <span>{formatTimestamp(call.timestamp)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => handleCallAgain(e, call.callType)}>
            {call.callType === 'voice' ? <Phone className="h-6 w-6 text-primary" /> : <Video className="h-6 w-6 text-primary" />}
          </Button>
        </div>
      </div>
      <CallDetailsSheet open={isSheetOpen} onOpenChange={setIsSheetOpen} contact={contact} />
    </>
  );
}


export default function CallsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [imagePreview, setImagePreview] = useState<ImagePreviewState | null>(null);
  const { toast } = useToast()
  const { user, firestore } = useFirebase();

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'contacts'), orderBy('lastMessageTimestamp', 'desc'));
  }, [firestore, user]);

  const { data: contacts, isLoading: areContactsLoading } = useCollection<Contact>(contactsQuery);

  const [callHistory, setCallHistory] = useState<Contact[]>([]);

  useEffect(() => {
    if (contacts) {
      // Simulate a call history from contacts
      const history = contacts.map((c, i) => ({
        ...c,
        call: {
          type: i % 3 === 0 ? 'missed' : (i % 2 === 0 ? 'incoming' : 'outgoing'),
          callType: i % 2 === 0 ? 'video' : 'voice',
          timestamp: new Date(Date.now() - i * 1000 * 60 * 60 * 3), // 3 hours apart
        }
      }));
      setCallHistory(history);
    }
  }, [contacts]);

  const hasMissedCalls = useMemo(() => {
    return callHistory.some(c => c.call?.type === 'missed');
  }, [callHistory]);


  const navItems = [
    { href: '/chats', icon: MessageSquare, label: 'Chats', hasNotification: false },
    { href: '/calls', icon: Phone, label: 'Calls', hasNotification: hasMissedCalls },
    { href: '/nearby', icon: Users, label: 'Nearby', hasNotification: false },
  ]
  
  const renderCallList = (filter?: 'missed' | 'outgoing' | 'incoming') => {
    if (areContactsLoading) {
      return (
        <div className="flex items-center justify-center p-10">
          <LoaderCircle className="w-8 h-8 animate-spin" />
        </div>
      )
    }

    const filteredCalls = filter 
      ? callHistory.filter(c => c.call?.type === filter)
      : callHistory;

    if (filteredCalls.length === 0) {
      return (
        <div className="text-center p-8 mt-10">
            <PhoneMissed className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-4 text-xl font-semibold">No {filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : ''} Calls</h2>
            <p className="mt-2 text-muted-foreground">Your call history will appear here.</p>
        </div>
      );
    }

    return (
      <div className="divide-y">
        {filteredCalls.map(contact => <CallItem key={contact.id} contact={contact} />)}
      </div>
    )
  }

  return (
    <>
      <Sidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
      <div className="flex flex-col h-full">
        <header className="flex items-center gap-2 p-4 border-b shrink-0">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setIsSidebarOpen(true)}>
            <User className="h-7 w-7" />
            <span className="sr-only">Open sidebar</span>
          </Button>
          <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                type="search" 
                placeholder="Search calls..." 
                className="pl-10 rounded-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled // Search not implemented yet
            />
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11">
            <MoreVertical className="h-6 w-6" />
            <span className="sr-only">More options</span>
          </Button>
        </header>

        <main className="flex-1 flex flex-col overflow-y-auto">
            <Card className="m-4 rounded-lg bg-amber-500/10 border-amber-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Construction className="h-5 w-5" />
                        Developer Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-700 dark:text-amber-500 space-y-2">
                    <p>The call feature is currently a **simulation**. No real audio or video is transmitted. This call log is also simulated for demonstration purposes.</p>
                    <p>This will be fully functional in the production release.</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                        <Link href="/feedback">Give Feedback</Link>
                    </Button>
                </CardContent>
            </Card>

          <Tabs defaultValue="all" className="flex flex-col flex-1 px-4">
            <TabsList className="shrink-0">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="missed">Missed</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto mt-2">
                <TabsContent value="all">{renderCallList()}</TabsContent>
                <TabsContent value="missed">{renderCallList('missed')}</TabsContent>
            </div>
          </Tabs>
        </main>
         <footer className="border-t shrink-0 bg-card">
          <nav className="grid grid-cols-3 items-center p-2">
            {navItems.map((item, index) => (
              <NavLink key={index} href={item.href} icon={item.icon} label={item.label} hasNotification={item.hasNotification} />
            ))}
          </nav>
        </footer>
      </div>
       <ImagePreviewDialog
        imagePreview={imagePreview}
        onOpenChange={(open) => !open && setImagePreview(null)}
      />
    </>
  )
}
