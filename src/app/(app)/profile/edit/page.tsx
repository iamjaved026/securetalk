
'use client'

import { useState, useEffect, useRef, useContext } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, BadgeCheck, LoaderCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase'
import { doc, getDocs, collection, writeBatch } from 'firebase/firestore'
import { ImageCropperDialog } from '@/components/image-cropper-dialog'
import { AppContext } from '@/app/(app)/layout'

export default function EditProfilePage() {
  const { toast } = useToast()
  const { firestore, user } = useFirebase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setAvatarPreview } = useContext(AppContext);

  const userDocRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isSaving, setIsSaving] = useState(false);
  
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (userProfile) {
        setName(userProfile.name || '');
        setBio(userProfile.bio || '');
        setAvatar(userProfile.profilePictureUrl || userProfile.avatar || '');
    }
  }, [userProfile]);

  useEffect(() => {
    if (isProfileLoading) return;
    const nameChanged = name !== (userProfile?.name || '');
    const bioChanged = bio !== (userProfile?.bio || '');
    const avatarChanged = avatar !== (userProfile?.profilePictureUrl || userProfile?.avatar || '');
    setHasChanges(nameChanged || bioChanged || avatarChanged);
  }, [name, bio, avatar, userProfile, isProfileLoading]);


  const handleSave = async () => {
    if (!userDocRef || !user || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "User not authenticated."});
        return;
    }
    
    // TEMPORARY DEBUGGING LOGIC
    if (user.uid === 'Ysf0cXtN8zTxbqhmSjaUBSAz21v2') {
        console.log("--- DEBUGGING USER CONTACTS ---");
        console.log("Current User ID:", user.uid);
        const myContactsQuery = collection(firestore, 'users', user.uid, 'contacts');
        const querySnapshot = await getDocs(myContactsQuery);
        console.log(`Found ${querySnapshot.size} contacts for this user.`);
        querySnapshot.forEach((contactDoc) => {
            console.log("Contact ID:", contactDoc.id, "Data:", contactDoc.data());
        });
        toast({ title: "Debug Info Logged", description: "Contact data has been printed to the browser console." });
        return; // Stop execution to prevent the error
    }
    
    setIsSaving(true);
    const profileData = {
        name,
        bio,
        profilePictureUrl: avatar,
    };
    
    const batch = writeBatch(firestore);

    // 1. Update the user's own profile document
    batch.set(userDocRef, profileData, { merge: true });

    // 2. Propagate changes to all contacts who have this user in their list
    try {
        const myContactsQuery = collection(firestore, 'users', user.uid, 'contacts');
        const querySnapshot = await getDocs(myContactsQuery);
        querySnapshot.forEach((contactDoc) => {
            // Check if the contact is a group before attempting to update
            if (!contactDoc.data().isGroup) {
                const contactId = contactDoc.id;
                // This is the reference to this user's profile inside a contact's subcollection
                const otherUserContactRef = doc(firestore, 'users', contactId, 'contacts', user.uid);
                batch.update(otherUserContactRef, {
                    name: name,
                    avatar: avatar,
                    bio: bio,
                });
            }
        });

        await batch.commit();

        toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved successfully.',
        });
        setIsSaving(false);
        setHasChanges(false);

    } catch (error) {
        console.error("Error propagating profile changes:", error);
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update all contact entries.'});
        setIsSaving(false);
    }
  }
  
  const handleAvatarChange = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for Vercel Hobby tier
        toast({
          variant: "destructive",
          title: "Image too large",
          description: "Please select an image smaller than 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input to allow selecting the same file again
    event.target.value = '';
  };
  
  const uploadCroppedImage = async (croppedImage: string): Promise<string> => {
    const response = await fetch(croppedImage);
    const blob = await response.blob();
    
    const uploadResponse = await fetch(`/api/upload?filename=avatar-${user?.uid}.jpg`, {
      method: 'POST',
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }
    const { url } = await uploadResponse.json();
    return url;
  };

  const handleAvatarClick = () => {
    if (avatar) {
      setAvatarPreview({ avatarUrl: avatar, name: name });
    }
  };

  if (isProfileLoading) {
      return (
          <div className="flex h-full items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
      <>
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Profile</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <button onClick={handleAvatarClick}>
                    <Avatar className="w-32 h-32">
                    <AvatarImage src={avatar} alt={name} data-ai-hint="person portrait" />
                    <AvatarFallback>{name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                </button>
                <Button
                variant="outline"
                size="icon"
                className="absolute bottom-1 right-1 rounded-full h-9 w-9 bg-background/80 backdrop-blur-sm"
                onClick={handleAvatarChange}
                >
                <Camera className="h-5 w-5" />
                <span className="sr-only">Change profile picture</span>
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

            <div className="space-y-4">
                <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="name">Full Name</Label>
                    <span className="text-xs text-muted-foreground">{name.length} / 50</span>
                </div>
                <div className="relative">
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pr-10" maxLength={50} />
                    {userProfile?.verified && <BadgeCheck className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />}
                </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={userProfile?.username || ''} disabled />
                     <p className="text-xs text-muted-foreground">Your unique username cannot be changed.</p>
                </div>
                <div>
                <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="bio">Bio</Label>
                    <span className="text-xs text-muted-foreground">{bio.length} / 160</span>
                </div>
                <Textarea id="bio" placeholder="Tell us a little about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={160} />
                </div>
            </div>
        </div>
      </main>
       <footer className="p-4 shrink-0 border-t bg-card">
          <Button className="w-full" onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <Save className="mr-2" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </footer>
    </div>
      <ImageCropperDialog 
        imageSrc={imageToCrop}
        onClose={() => setImageToCrop(null)}
        onSave={async (croppedImage) => {
            setImageToCrop(null);
            setIsSaving(true); // Show loading indicator
            try {
              const downloadURL = await uploadCroppedImage(croppedImage);
              setAvatar(downloadURL);
            } catch (e) {
              toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload avatar.'});
            } finally {
              setIsSaving(false);
            }
        }}
      />
    </>
  )
}
