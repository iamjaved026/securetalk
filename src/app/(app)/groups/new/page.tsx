

'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Camera, Save, LoaderCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';
import { collection, doc, setDoc, addDoc, Timestamp, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function NewGroupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, firestore } = useFirebase();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateGroup = async () => {
    if (!name || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Group Name Required',
        description: 'Please provide a name for your group.',
      });
      return;
    }

    setIsCreating(true);

    const batch = writeBatch(firestore);

    // 1. Create a new document reference for the group
    const newGroupRef = doc(collection(firestore, 'groups'));
    const groupId = newGroupRef.id;

    const groupData = {
      id: groupId,
      name,
      description: description || '',
      avatar: avatar || '',
      ownerId: user.uid,
      participants: {
        [user.uid]: true,
      },
      createdAt: serverTimestamp(),
      permissions: {
        editInfo: 'only_owner',
        approveMembers: 'only_owner',
        sendMessages: 'all_participants',
      }
    };
    
    batch.set(newGroupRef, groupData);

    // 2. Create the contact entry for the user
    const userContactRef = doc(firestore, 'users', user.uid, 'contacts', `group_${groupId}`);
    const userContactData = {
      id: `group_${groupId}`,
      name,
      avatar: avatar || '',
      isGroup: true,
      lastMessageTimestamp: serverTimestamp(),
    };
    batch.set(userContactRef, userContactData);

    // 3. Commit the batch and handle potential errors
    try {
        await batch.commit();
        toast({
            title: 'Group Created!',
            description: 'Now you can invite members.',
        });
        router.push(`/groups/${groupId}/invite`);
    } catch (serverError) {
        // Create and emit the specialized error for debugging
        const contextualError = new FirestorePermissionError({
          path: newGroupRef.path,
          operation: 'create',
          requestResourceData: groupData,
        });
        errorEmitter.emit('permission-error', contextualError);
    } finally {
        setIsCreating(false);
    }
  };
  
  const handleAvatarChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({ variant: "destructive", title: "Image too large" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };
  
  const uploadCroppedImage = async (croppedImage: string): Promise<string> => {
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    
    const uploadResponse = await fetch(`/api/upload?filename=group-avatar-${Date.now()}.jpg`, {
      method: 'POST',
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }
    const { url } = await uploadResponse.json();
    return url;
  };

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
        <h1 className="text-2xl font-bold font-headline">New Group</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader className="text-center">
             <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <Avatar className="w-24 h-24 text-2xl">
                        <AvatarImage src={avatar} alt={name} data-ai-hint="group symbol" />
                        <AvatarFallback>
                            {name ? name.charAt(0) : <Users />}
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background/80 backdrop-blur-sm"
                        onClick={handleAvatarChangeClick}
                    >
                        <Camera className="h-4 w-4" />
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
            <CardTitle className="pt-4">Group Details</CardTitle>
            <CardDescription>
              Set up your new group's name and avatar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="name">Group Name</Label>
                  <span className="text-xs text-muted-foreground">{name.length} / 50</span>
                </div>
                <Input
                  id="name"
                  placeholder="e.g., Project Phoenix Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <span className="text-xs text-muted-foreground">{description.length} / 250</span>
                 </div>
                <Textarea
                  id="description"
                  placeholder="What's this group about?"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={250}
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <footer className="p-4 border-t bg-card shrink-0">
        <Button onClick={handleCreateGroup} className="w-full" disabled={isCreating || !name}>
          {isCreating ? <LoaderCircle className="mr-2 animate-spin" /> : <Save className="mr-2" />}
          {isCreating ? 'Creating...' : 'Create & Continue'}
        </Button>
      </footer>
    </div>
    <ImageCropperDialog 
        imageSrc={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onSave={async (croppedImage) => {
            setImageToCrop(null);
            setIsCreating(true); // Show loading indicator while uploading
            try {
              const downloadURL = await uploadCroppedImage(croppedImage);
              setAvatar(downloadURL);
            } catch (e) {
              toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the avatar.'});
            } finally {
              setIsCreating(false);
            }
        }}
    />
    </>
  );
}
