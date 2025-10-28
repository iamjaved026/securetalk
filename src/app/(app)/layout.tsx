
'use client'

import React, { useState, useContext, useEffect, useRef, forwardRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion, useDragControls, PanInfo } from 'framer-motion'
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase'
import { doc, onSnapshot, updateDoc, collection, query, orderBy, Timestamp, limit, getDocs, serverTimestamp as firestoreServerTimestamp, setDoc } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import type { Contact, Message } from '@/lib/types'
import { playTone, tones } from '@/lib/audio'
import { ProfileAvatarPreview, type ProfileAvatarPreviewState } from '@/components/profile-avatar-preview'

// Create a context to share the avatar preview state
export const AppContext = React.createContext<{
  setAvatarPreview: (preview: ProfileAvatarPreviewState) => void;
  isAvatarPreviewOpen: boolean;
}>({
  setAvatarPreview: () => {},
  isAvatarPreviewOpen: false,
});

const pageOrder = ['/chats', '/calls', '/nearby'];

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

// New wrapper component to solve hydration issues
const PageWrapper = forwardRef<HTMLDivElement, { children: React.ReactNode, onPanEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void }>(
    ({ children, onPanEnd }, ref) => {
        return (
            <motion.div
                ref={ref}
                onPanEnd={onPanEnd}
                className="h-full w-full flex-1"
                style={{ touchAction: 'pan-y' }}
            >
                {children}
            </motion.div>
        );
    }
);
PageWrapper.displayName = 'PageWrapper';


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const lastTimestampsRef = React.useRef<Map<string, Timestamp>>(new Map());

  const [avatarPreview, setAvatarPreview] = useState<ProfileAvatarPreviewState>(null);
  const isAvatarPreviewOpen = !!avatarPreview;
  
  const contentRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  const searchParams = useSearchParams().toString();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const currentIndex = pageOrder.indexOf(pathname);
    const prevIndex = pageOrder.indexOf(prevPathnameRef.current);
    if (currentIndex !== -1 && prevIndex !== -1) {
        setDirection(currentIndex > prevIndex ? 1 : -1);
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const contactsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'contacts'), orderBy('lastMessageTimestamp', 'desc'));
  }, [firestore, user]);

  const { data: contacts } = useCollection<Contact>(contactsQuery);
  
  useEffect(() => {
    console.log("%c👋 Hey there, curious genius!", "color: #2563eb; font-size: 20px; font-weight: bold;");
    console.log("%cYou just unlocked Secure Talk’s hidden console message 👀", "font-style: italic; font-size: 14px;");
    console.log("We love curious minds like yours — people who explore beyond the UI.");
    console.log("\n%c🚀 Secure Talk is an open-source, privacy-first messenger built by students for the world.", "font-size: 14px;");
    console.log("If you’d like to contribute, join us on GitHub:\n🔗 https://github.com/jvdhussain026/secure_talk");
    console.log("\n%cP.S. – Curiosity is your superpower. Never lose it 💫", "font-weight: bold; font-size: 14px;");
  }, []);

  React.useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const isEditable = target.tagName === 'INPUT' ||
                           target.tagName === 'TEXTAREA' ||
                           target.isContentEditable;
        const isMessageText = target.closest('.select-text');
        if (!isEditable && !isMessageText) {
            event.preventDefault();
        }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  React.useEffect(() => {
    if (!user || !firestore) return;
    const userStatusFirestoreRef = doc(firestore, `users/${user.uid}`);
    setDoc(userStatusFirestoreRef, {
        status: 'online',
        lastSeen: firestoreServerTimestamp()
    }, { merge: true });
    const handleBeforeUnload = () => {
        setDoc(userStatusFirestoreRef, {
            status: 'offline',
            lastSeen: firestoreServerTimestamp()
        }, { merge: true });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
         setDoc(userStatusFirestoreRef, {
            status: 'offline',
            lastSeen: firestoreServerTimestamp()
        }, { merge: true });
    }
  }, [user, firestore]);

  React.useEffect(() => {
    if (userDocRef) {
      const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data) {
          if (data.lastConnection) {
            router.push(`/chats/${data.lastConnection}`);
            updateDoc(userDocRef, { lastConnection: null });
          }
          if (data.incomingCall && data.incomingCall.from && !pathname.startsWith('/call')) {
             router.push(`/call?contactId=${data.incomingCall.from}&type=${data.incomingCall.type}&status=incoming`);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [userDocRef, router, pathname]);
  
  React.useEffect(() => {
    if (!contacts || !firestore || !user) return;
    const initialLoad = lastTimestampsRef.current.size === 0;
    if (initialLoad) {
      contacts.forEach(contact => {
        if (contact.lastMessageTimestamp) {
          lastTimestampsRef.current.set(contact.id, contact.lastMessageTimestamp);
        }
      });
      return;
    }
    contacts.forEach(contact => {
      const lastKnownTimestamp = lastTimestampsRef.current.get(contact.id);
      if (contact.lastMessageTimestamp && (!lastKnownTimestamp || contact.lastMessageTimestamp > lastKnownTimestamp)) {
        const isOnChatPage = pathname === `/chats/${contact.id}`;
        if (!isOnChatPage) {
          const chatId = [user.uid, contact.id].sort().join('_');
          const messagesQuery = query(
            collection(firestore, "chats", chatId, "messages"), 
            orderBy("timestamp", "desc"),
            limit(1)
          );
          getDocs(messagesQuery).then((snapshot) => {
             if(!snapshot.empty) {
               const lastMessage = snapshot.docs[0].data() as Message;
               if (lastMessage.senderId === contact.id) {
                 toast({
                   title: `New message from ${contact.name}`,
                   description: lastMessage.text || 'Sent an attachment',
                 });
                 const messageToneName = localStorage.getItem('messageTone');
                 const toneToPlay = tones.find(t => t.name === messageToneName) || tones[0];
                 playTone(toneToPlay.sequence);
               }
             }
          });
        }
        lastTimestampsRef.current.set(contact.id, contact.lastMessageTimestamp);
      }
    });
  }, [contacts, pathname, toast, user, firestore]);
  
  const handleSetAvatarPreview = (preview: ProfileAvatarPreviewState) => {
      setAvatarPreview(preview);
  }

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) {
        return;
    }

    const swipeThreshold = 50; 
    const velocityThreshold = 400; 
    const swipe = info.offset.x;
    const velocity = info.velocity.x;
    const currentIndex = pageOrder.indexOf(pathname);
    
    if ((swipe > swipeThreshold || velocity > velocityThreshold) && currentIndex > 0) {
        setDirection(-1);
        router.push(pageOrder[currentIndex - 1]);
    } 
    else if ((swipe < -swipeThreshold || velocity < -velocityThreshold) && currentIndex < pageOrder.length - 1) {
        setDirection(1);
        router.push(pageOrder[currentIndex + 1]);
    }
  };

  return (
    <AppContext.Provider value={{ setAvatarPreview: handleSetAvatarPreview, isAvatarPreviewOpen }}>
      <div 
        ref={contentRef}
        className={cn("h-full md:max-w-md md:mx-auto md:border-x flex flex-col overflow-hidden")}
      >
        <AnimatePresence initial={false} custom={direction}>
            <motion.div
                 key={pathname + searchParams}
                 custom={direction}
                 variants={variants}
                 initial="enter"
                 animate="center"
                 exit="exit"
                 transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                 }}
                 className="h-full w-full"
            >
                <PageWrapper onPanEnd={handlePanEnd}>
                    {children}
                </PageWrapper>
            </motion.div>
        </AnimatePresence>
      </div>
      <ProfileAvatarPreview
          preview={avatarPreview}
          onOpenChange={(isOpen) => {
              if (!isOpen) setAvatarPreview(null);
          }}
      />
    </AppContext.Provider>
  );
}
