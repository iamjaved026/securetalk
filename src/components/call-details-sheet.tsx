

"use client"

import { useState } from 'react';
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Contact } from "@/lib/types"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ComingSoonDialog } from './coming-soon-dialog';

declare global {
  interface Window {
    SecureTalkNative?: {
      send: (type: string, payload: any) => void;
    };
  }
}

type CallDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
};

export function CallDetailsSheet({ open, onOpenChange, contact }: CallDetailsSheetProps) {
  const { toast } = useToast()

  const handleCall = (type: 'voice' | 'video') => {
    if (window.SecureTalkNative) {
      window.SecureTalkNative.send('START_CALL', {
        contactId: contact.id,
        contactName: contact.name,
        type: type,
      });
      onOpenChange(false);
    } else {
      alert('Calls are only available in the SecureTalk app.');
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={() => onOpenChange(false)}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card p-4 shadow-lg md:max-w-md md:mx-auto"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person portrait" />
            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
             <div className={cn(
                "absolute bottom-0 right-1 h-4 w-4 rounded-full border-2 border-card",
                 // @ts-ignore
                contact.status === 'online' ? "bg-green-500" : "bg-gray-400"
              )} />
          </Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{contact.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
               {/* @ts-ignore */}
              {contact.status || 'Offline'}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button size="lg" variant="outline" onClick={() => handleCall('voice')}>
                <Phone className="mr-2" />
                Voice Call
          </Button>
          <Button size="lg" onClick={() => handleCall('video')}>
             <Video className="mr-2" />
             Video Call
          </Button>
        </div>
      </motion.div>
    </>
  );
}
