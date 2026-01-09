
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Phone } from 'lucide-react';
import type { Contact } from '@/lib/types';

type CallEndedScreenProps = {
  contact: Contact;
  duration: number;
};

export function CallEndedScreen({ contact, duration }: CallEndedScreenProps) {
  const router = useRouter();

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} sec`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} sec`;
  };

  return (
    <div className="relative h-full flex flex-col items-center justify-center text-foreground bg-background p-8">
      <header className="absolute top-0 left-0 w-full p-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
      </header>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
        className="flex flex-col items-center text-center"
      >
        <Avatar className="w-32 h-32 border-4 border-border mb-6">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-3xl font-bold font-headline">Call Ended</h2>
        <p className="mt-2 text-lg text-muted-foreground">with {contact.name}</p>
        {duration > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            Duration: {formatDuration(duration)}
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="mt-12 w-full max-w-xs space-y-3"
      >
        <Button size="lg" className="w-full" asChild>
          <Link href={`/call?contactId=${contact.id}&type=voice&status=outgoing`}>
            <Phone className="mr-2" />
            Call Again
          </Link>
        </Button>
        <Button size="lg" variant="outline" className="w-full" asChild>
          <Link href={`/chats/${contact.id}`}>
            <MessageSquare className="mr-2" />
            Send Message
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
