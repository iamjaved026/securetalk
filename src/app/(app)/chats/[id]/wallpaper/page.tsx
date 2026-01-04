
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, Upload, Save, RotateCcw, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChatWallpapers } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';

function ChatPreview() {
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground text-sm shadow-md rounded-l-xl rounded-t-xl max-w-[70%]">
                    <div className="px-2.5 pt-1.5">
                        <p>This is your new wallpaper!</p>
                        <div className="flex items-center justify-end gap-1.5 text-primary-foreground/70 text-xs pt-1 pb-1">
                            <span>10:30 AM</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-start">
                 <div className="bg-card text-card-foreground text-sm shadow-md rounded-r-xl rounded-t-xl max-w-[70%]">
                    <div className="px-2.5 pt-1.5">
                        <p>Looks great!</p>
                         <div className="flex items-center justify-start gap-1.5 text-muted-foreground text-xs pt-1 pb-1">
                            <span>10:31 AM</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PerChatWallpaperPage() {
    const params = useParams();
    const router = useRouter();
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    
    const contactId = params.id as string;
    const chatId = user?.uid && contactId ? [user.uid, contactId].sort().join('_') : null;

    const chatDocRef = useMemoFirebase(() => {
        if (!firestore || !chatId) return null;
        return doc(firestore, 'chats', chatId);
    }, [firestore, chatId]);

    const { data: chatData, isLoading: isChatLoading } = useDoc(chatDocRef);

    const [selectedWallpaper, setSelectedWallpaper] = useState<string | null | undefined>(undefined);
    const [savedWallpaper, setSavedWallpaper] = useState<string | null | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (!isChatLoading && chatData !== undefined) {
             const initialWallpaper = chatData?.wallpaper; // Can be URL, null, or undefined
             setSelectedWallpaper(initialWallpaper);
             setSavedWallpaper(initialWallpaper);
        }
    }, [chatData, isChatLoading]);

    const handleSelectWallpaper = (wallpaperUrl: string | null) => {
        setSelectedWallpaper(wallpaperUrl);
    };

    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            toast({
                variant: 'destructive',
                title: 'Image too large',
                description: 'Please select an image smaller than 4MB.'
            });
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setSelectedWallpaper(dataUrl);
            toast({ title: 'Preview updated!', description: 'Click "Save Changes" to apply.' });
        };
        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'File Error', description: 'Could not read the selected file.' });
        };
    };
    
    const handleResetToDefault = () => {
        // Reset to theme default (no wallpaper)
        handleSelectWallpaper(null);
        toast({ title: 'Preview reset to default.', description: 'Click Save Changes to apply.' });
    };
    
    const handleSave = async () => {
        if (!chatDocRef || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Cannot save wallpaper. User or chat not found.' });
            return;
        }

        setIsSaving(true);
        try {
            let finalUrlToSave = selectedWallpaper;

            if (selectedWallpaper && selectedWallpaper.startsWith('data:image')) {
                const response = await fetch(selectedWallpaper);
                const blob = await response.blob();
                const uploadResponse = await fetch(`/api/upload?filename=wallpaper-${chatId}.jpg`, {
                  method: 'POST',
                  body: blob,
                });
                if (!uploadResponse.ok) throw new Error('Upload failed');
                const { url } = await uploadResponse.json();
                finalUrlToSave = url;
            }

            await updateDoc(chatDocRef, { wallpaper: finalUrlToSave });
            
            toast({ title: 'Chat Wallpaper Saved!', description: 'Your new wallpaper has been applied to this chat.' });
            router.back();

        } catch (error) {
            console.error("Failed to save wallpaper:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the new wallpaper.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const hasChanges = savedWallpaper !== selectedWallpaper;

    if (isChatLoading || selectedWallpaper === undefined) {
        return (
             <div className="flex h-full items-center justify-center bg-secondary">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
            <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/chats/${contactId}`}>
                        <ArrowLeft className="h-6 w-6" />
                        <span className="sr-only">Back to Chat</span>
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold font-headline">Chat Wallpaper</h1>
            </header>

            <ScrollArea className="flex-1">
                <main className="p-4 md:p-6 space-y-6">
                    <Card>
                        <CardContent className="p-2">
                            <div 
                                className={cn(
                                    "relative aspect-[9/16] w-full rounded-lg overflow-hidden bg-muted",
                                    !selectedWallpaper && "bg-chat"
                                )}
                                style={ selectedWallpaper ? { backgroundImage: `url(${selectedWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                            >
                                <ChatPreview />
                            </div>
                        </CardContent>
                    </Card>

                    <h3 className="font-semibold text-muted-foreground px-2">Choose Wallpaper for this Chat</h3>

                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={handleFileUploadClick} 
                            className="aspect-square bg-card rounded-lg flex flex-col items-center justify-center gap-2 text-primary border-2 border-dashed hover:bg-accent"
                        >
                            <Upload className="w-8 h-8" />
                            <span className="text-sm font-medium">Upload Photo</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <button onClick={() => handleSelectWallpaper(null)} className="relative aspect-square rounded-lg overflow-hidden group bg-muted border">
                            <div className="w-full h-full bg-chat" />
                            <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity", selectedWallpaper === null ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", selectedWallpaper === null ? 'bg-primary text-primary-foreground' : 'bg-white/50 text-white')}>
                                    <Check className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-xs font-semibold">Theme Color</span>
                            </div>
                        </button>

                        {ChatWallpapers.map(wallpaper => (
                            <button key={wallpaper.id} onClick={() => handleSelectWallpaper(wallpaper.imageUrl)} className="relative aspect-square rounded-lg overflow-hidden group">
                                <Image src={wallpaper.imageUrl} alt={wallpaper.description} layout="fill" objectFit="cover" data-ai-hint={wallpaper.imageHint}/>
                                <div className={cn("absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity", selectedWallpaper === wallpaper.imageUrl ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", selectedWallpaper === wallpaper.imageUrl ? 'bg-primary text-primary-foreground' : 'bg-white/50 text-white')}>
                                        <Check className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="text-white text-xs font-semibold">{wallpaper.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </main>
            </ScrollArea>
             <footer className="p-4 border-t shrink-0 bg-card">
                <div className="flex gap-2">
                    <Button variant="outline" className="w-full" onClick={handleResetToDefault}>
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset to Default
                    </Button>
                    <Button className="w-full" onClick={handleSave} disabled={!hasChanges || isSaving}>
                        {isSaving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </footer>
        </div>
    );
}

    
