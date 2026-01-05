
"use client"

import { useState } from "react"
import { Drawer } from "vaul"
import { formatDistanceToNowStrict, differenceInMinutes } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Copy, UserPlus, Calendar, Check, Info } from "lucide-react"
import type { Contact } from "@/lib/types"
import { cn } from '@/lib/utils'
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type AdminUserDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Contact;
  onConnect: (user: Contact) => void;
};

function DetailItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) {
    return (
        <div className="flex items-start gap-4">
            <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold text-base">{value}</p>
            </div>
        </div>
    )
}

export function AdminUserDetailSheet({ open, onOpenChange, user, onConnect }: AdminUserDetailSheetProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast({ title: "User ID Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const formattedDate = user.createdAt ? user.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A';
  const lastSeenText = user.lastSeen ? formatDistanceToNowStrict(user.lastSeen.toDate(), { addSuffix: true }) : 'Never';
  const isOnline = user.lastSeen && differenceInMinutes(new Date(), user.lastSeen.toDate()) < 5;


  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.7, 1]} modal={true}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-card flex flex-col rounded-t-[10px] h-full max-h-[96%] mt-24 fixed bottom-0 left-0 right-0 focus:outline-none z-50 md:max-w-md md:mx-auto md:h-[calc(96%_-_2rem)]">
           <div className="p-4 bg-card rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mb-4" />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="sr-only">User Details: {user.name}</Drawer.Title>
              
              <div className="flex flex-col items-center text-center p-4 pt-0">
                  <div className="relative">
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={user.avatar || user.profilePictureUrl} alt={user.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className={cn(
                        "absolute bottom-4 right-1 h-5 w-5 rounded-full border-4 border-card",
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      )} />
                  </div>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-muted-foreground capitalize">{isOnline ? 'Online' : `Last seen ${lastSeenText}`}</p>
                </div>

                <div className="space-y-4 p-4 border-t">
                    <DetailItem icon={Info} label="User ID" value={user.id} />
                    <DetailItem icon={Calendar} label="Date Joined" value={formattedDate} />
                </div>

                <div className="p-4 grid grid-cols-2 gap-3">
                     <Button variant="outline" onClick={handleCopyId}>
                        {copied ? <Check className="mr-2 text-green-500" /> : <Copy className="mr-2" />}
                        {copied ? 'Copied!' : 'Copy ID'}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2"/>
                                Connect
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Connect with {user.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This will add {user.name} to your contact list and you will be able to start a chat with them.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onConnect(user)}>
                                    Yes, connect
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
