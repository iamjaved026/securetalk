
"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { formatDistanceToNowStrict, differenceInMinutes } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { FileText, Link as LinkIcon, Download, PlayCircle, BadgeCheck, Image as ImageIcon, Video, FileUp, Globe, Shield, Edit, Save, X, LoaderCircle } from "lucide-react"

import type { Contact, Message } from "@/lib/types"
import { Badge } from "./ui/badge"
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase"
import { updateDocumentNonBlocking } from "@/firebase"
import { doc } from 'firebase/firestore'
import { Input } from "./ui/input"
import { useToast } from "@/hooks/use-toast"
import { AppContext } from "@/app/(app)/layout"


type UserDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact & { profilePictureUrl?: string };
  messages: Message[];
}

const EmptyState = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
        <Icon className="h-12 w-12 mb-4" />
        <p>{text}</p>
    </div>
);

export function UserDetailsSheet({ open, onOpenChange, contact, messages }: UserDetailsSheetProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { setAvatarPreview } = React.useContext(AppContext);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editedName, setEditedName] = React.useState(contact.displayName || contact.name);

  const localContactDocRef = useMemoFirebase(() => {
    if (!firestore || !user || !contact) return null;
    return doc(firestore, 'users', user.uid, 'contacts', contact.id);
  }, [firestore, user, contact]);

  React.useEffect(() => {
    if (contact) {
        setEditedName(contact.displayName || contact.name);
    }
  }, [contact]);


  const avatarUrl = contact.profilePictureUrl || contact.avatar;
  const displayName = contact.displayName || contact.name;
  const realName = contact.name;

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(avatarUrl) {
        setAvatarPreview({ avatarUrl, name: displayName });
        onOpenChange(false); // Close the sheet
    }
  };
  
  const handleSaveName = () => {
    if (!localContactDocRef) return;
    if (editedName.trim().length < 2) {
        toast({ variant: 'destructive', title: "Name is too short." });
        return;
    }
    setIsSaving(true);
    updateDocumentNonBlocking(localContactDocRef, { displayName: editedName });
    toast({ title: "Contact name updated!" });
    setIsSaving(false);
    setIsEditing(false);
  }

  const handleCancelEdit = () => {
    setEditedName(displayName);
    setIsEditing(false);
  }

  const statusText = React.useMemo(() => {
    if (contact.status === 'online') {
      return 'Active now';
    }
    if (contact.lastSeen) {
        const minsSinceLastSeen = differenceInMinutes(new Date(), contact.lastSeen.toDate());
        if (minsSinceLastSeen < 1) {
            return 'Active just now';
        }
        if (minsSinceLastSeen <= 5) {
            return `Active a few minutes ago`;
        }
    }
    return ''; // Show nothing if offline for more than 5 mins
  }, [contact.status, contact.lastSeen]);

  const sharedMedia = React.useMemo(() => {
    const images: string[] = [];
    const videos: string[] = [];
    const docs: { name: string, size: string, url: string }[] = [];
    const links: { title: string, url: string }[] = [];

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    messages.forEach(message => {
        // Find attachments
        message.attachments?.forEach(attachment => {
            switch(attachment.type) {
                case 'image': images.push(attachment.url); break;
                case 'video': videos.push(attachment.url); break;
                case 'document': docs.push({ name: attachment.name || 'Document', size: attachment.size || 'N/A', url: attachment.url }); break;
            }
        });

        // Find links in text
        if (message.text) {
            const foundUrls = message.text.match(urlRegex);
            if (foundUrls) {
                foundUrls.forEach(url => {
                    try {
                        const hostname = new URL(url).hostname;
                        links.push({ title: hostname, url });
                    } catch (e) {
                        // Ignore invalid URLs
                    }
                });
            }
        }
    });

    return { images, videos, docs, links };

  }, [messages]);

  return (
      <>
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.6, 1]} modal={true}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="bg-card flex flex-col rounded-t-[10px] h-full max-h-[96%] mt-24 fixed bottom-0 left-0 right-0 focus:outline-none md:max-w-md md:mx-auto md:h-[calc(96%_-_2rem)] z-50">
           <div className="p-4 bg-card rounded-t-[10px] flex-1">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-border mb-4" />
            <div className="max-w-md mx-auto">
              <Drawer.Title className="sr-only">User Details: {displayName}</Drawer.Title>
              <Drawer.Description className="sr-only">Detailed information and shared media for {displayName}.</Drawer.Description>
              <ScrollArea className="h-[calc(100vh_-_150px)] md:h-[calc(100vh_-_174px)]">
                <div className="flex flex-col items-center text-center p-4">
                  <button onClick={handleAvatarClick}>
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={avatarUrl} alt={displayName} data-ai-hint="person portrait" />
                        <AvatarFallback>{(displayName || '').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </button>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                           <Input 
                                value={editedName} 
                                onChange={(e) => setEditedName(e.target.value)} 
                                className="text-2xl font-bold h-11 text-center" 
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                                <X className="h-5 w-5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={isSaving}>
                                {isSaving ? <LoaderCircle className="animate-spin" /> : <Save className="h-5 w-5" />}
                            </Button>
                        </div>
                    ) : (
                         <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">{displayName}</h2>
                             <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                                <Edit className="h-5 w-5" />
                            </Button>
                         </div>
                    )}
                    {contact.verified && <BadgeCheck className="h-6 w-6 text-primary" />}
                  </div>
                   { (displayName !== realName) && <p className="text-sm text-muted-foreground mt-1">({realName})</p> }
                  <p className="text-muted-foreground">{statusText}</p>
                   {contact.verified && (
                        <Badge variant="outline" className="mt-4 border-primary/50 text-primary font-semibold">
                            <Shield className="mr-2 h-4 w-4" />
                            Secure Talk Developer
                        </Badge>
                   )}
                  <p className="text-sm mt-4 text-left w-full p-4 bg-muted rounded-lg">{contact.bio || 'No bio available.'}</p>
                </div>

                <Tabs defaultValue="images" className="w-full mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="images">Images</TabsTrigger>
                    <TabsTrigger value="videos">Videos</TabsTrigger>
                    <TabsTrigger value="docs">Docs</TabsTrigger>
                    <TabsTrigger value="links">Links</TabsTrigger>
                  </TabsList>
                  <TabsContent value="images" className="mt-4">
                     {sharedMedia.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {sharedMedia.images.map((src, i) => (
                                <Image key={i} src={src} alt={`Shared image ${i + 1}`} width={200} height={200} className="rounded-lg aspect-square object-cover" data-ai-hint="landscape abstract" />
                            ))}
                        </div>
                     ) : (
                        <EmptyState icon={ImageIcon} text="No photos shared yet." />
                     )}
                  </TabsContent>
                  <TabsContent value="videos" className="mt-4">
                     {sharedMedia.videos.length > 0 ? (
                         <div className="grid grid-cols-3 gap-2">
                           {sharedMedia.videos.map((src, i) => (
                            <div key={i} className="relative">
                               <Image src={src} alt={`Shared video ${i + 1}`} width={200} height={200} className="rounded-lg aspect-square object-cover" data-ai-hint="nature video" />
                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                 <PlayCircle className="w-8 h-8 text-white" />
                               </div>
                             </div>
                           ))}
                         </div>
                     ) : (
                         <EmptyState icon={Video} text="No videos shared yet." />
                     )}
                  </TabsContent>
                  <TabsContent value="docs" className="mt-4 space-y-2">
                    {sharedMedia.docs.length > 0 ? (
                        sharedMedia.docs.map((doc, i) => (
                            <a key={i} href={doc.url} download={doc.name} className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80">
                                <div className="p-2 bg-background rounded-md mr-3">
                                <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                <p className="font-semibold text-sm">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.size}</p>
                                </div>
                                <Button variant="ghost" size="icon"><Download className="w-5 h-5" /></Button>
                            </a>
                        ))
                    ) : (
                         <EmptyState icon={FileUp} text="No documents shared yet." />
                    )}
                  </TabsContent>
                  <TabsContent value="links" className="mt-4 space-y-2">
                    {sharedMedia.links.length > 0 ? (
                        sharedMedia.links.map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80">
                                <div className="p-2 bg-background rounded-md mr-3 shrink-0">
                                    <LinkIcon className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate">{link.title}</p>
                                <p className="text-xs text-primary break-all">{link.url}</p>
                                </div>
                            </a>
                        ))
                    ) : (
                         <EmptyState icon={Globe} text="No links shared yet." />
                    )}
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
    </>
  )
}
