
'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { ShieldCheck, UserPlus, LogIn, ArrowRight, ArrowLeft, LoaderCircle, Check, X, Settings, MessageSquare, Send, Eye, EyeOff, Camera, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, writeBatch, serverTimestamp, query, where, updateDoc, getDoc } from 'firebase/firestore';
import { getDocumentNonBlocking } from '@/firebase/non-blocking-reads';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';
import Image from 'next/image';


const InitialWelcomeStep = ({ onNext }: { onNext: () => void; }) => {
    return (
        <div className="h-full w-full flex flex-col p-8 text-foreground text-center bg-background">
            <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto">
                <ShieldCheck className="w-16 h-16 mb-6 text-primary drop-shadow-lg" />
                <h1 className="text-4xl font-bold font-headline drop-shadow-md">Welcome to Secure Talk</h1>
                <p className="text-lg text-muted-foreground mt-2">(Developer Preview)</p>
                <p className="mt-6 text-md text-muted-foreground max-w-md">
                    You're among the first to try Secure Talk! 🎉 This early release is for testers and developers. Your feedback shapes the future of private communication.
                </p>
                <Card className="mt-8 text-left p-4 w-full max-w-sm">
                    <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Share feedback directly with us:</h3>
                    <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                        <li>Open <Settings className="inline h-4 w-4" /> Settings → <Send className="inline h-4 w-4" /> Feedback & Report</li>
                        <li>Chat directly with **Secure Talk Dev** (we'll add them for you).</li>
                    </ul>
                </Card>
                 <p className="mt-6 text-md text-muted-foreground max-w-md">
                    Thanks for helping us build something truly secure. 🔐
                </p>
            </div>
            <div className="shrink-0 pt-4">
                <Button size="lg" className="w-full" onClick={onNext}>
                    Get Started <ArrowRight className="ml-2" />
                </Button>
            </div>
        </div>
    )
}


const WelcomeStep = ({ onNavigate, isSigningIn }: { onNavigate: (target: 'create' | 'recover') => void; isSigningIn: boolean; }) => {
    return (
        <div className="h-full w-full flex flex-col p-8 text-foreground text-center bg-background">
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="flex-1 flex flex-col justify-center items-center overflow-y-auto"
            >
                <ShieldCheck className="w-20 h-20 mb-6 text-primary drop-shadow-lg" />
                <h1 className="text-4xl font-bold font-headline drop-shadow-md">You're All Set</h1>
                <p className="mt-4 text-md text-muted-foreground max-w-md">
                    Create a new account to begin, or sign in to an existing one.
                </p>
            </motion.div>
            <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.8 }}
                 className="space-y-3 shrink-0 pt-4"
            >
                <Button size="lg" className="w-full" onClick={() => onNavigate('create')} disabled={isSigningIn}>
                    <UserPlus className="mr-2" />
                    Create New Account
                </Button>
                 <Button size="lg" className="w-full" variant="outline" onClick={() => onNavigate('recover')} disabled={isSigningIn}>
                    <LogIn className="mr-2" />
                    Sign In
                </Button>
            </motion.div>
        </div>
    );
};

function PasswordRequirement({ meets, text }: { meets: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {meets ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-destructive" />
      )}
      <span className={meets ? 'text-green-500' : 'text-destructive'}>{text}</span>
    </div>
  );
}

const CreateAccountStep = ({ onNext, onBack, isSaving }: { onNext: (username: string, fullName: string, password: string, avatar: string) => void; onBack: () => void; isSaving: boolean; }) => {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(PlaceHolderImages[0].imageUrl);
    
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [passLength, setPassLength] = useState(false);
    const [passChars, setPassChars] = useState(false);
    const [passMatch, setPassMatch] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        setPassLength(password.length >= 8);
        setPassChars(/\d/.test(password) && /[a-zA-Z]/.test(password));
        setPassMatch(password !== '' && password === confirmPassword);
    }, [password, confirmPassword]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
        setUsername(value);
        setIsAvailable(null);
    };
    
    const checkUsernameAvailability = async () => {
        if (username.length < 3) {
            toast({ variant: 'destructive', title: "Username too short."});
            return;
        }
        setIsChecking(true);
        setIsAvailable(null);
        const usernameRef = doc(firestore, 'usernames', username.toLowerCase());
        const usernameDoc = await getDoc(usernameRef);
        setIsAvailable(!usernameDoc.exists());
        setIsChecking(false);
    };
    
    const isFormValid = isAvailable === true && fullName.length >= 2 && passLength && passChars && passMatch;
    
    const handleNextClick = () => {
        if(isFormValid) {
            onNext(username, fullName, password, selectedAvatar);
        } else {
             toast({ variant: 'destructive', title: 'Please complete all fields correctly.'});
        }
    }
    
    const handleAvatarChangeClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({ variant: 'destructive', title: 'Image too large', description: 'Please select an image smaller than 4MB.' });
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
        
        const uploadResponse = await fetch(`/api/upload?filename=avatar-temp-${Date.now()}.jpg`, {
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
        <div className="h-full w-full flex flex-col p-8 bg-background">
             <header className="shrink-0 -mx-4 -mt-4 mb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft />
                </Button>
            </header>
            <div className="text-center shrink-0">
                <h2 className="text-2xl font-bold mb-2 font-headline">Create Your Account</h2>
                <p className="text-muted-foreground mb-8">Set up your profile to get started.</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2">
                <div className="flex flex-col items-center space-y-4">
                     <div className="relative">
                        <Avatar className="w-24 h-24 text-2xl">
                            <AvatarImage src={selectedAvatar} />
                            <AvatarFallback>
                                {fullName ? fullName.charAt(0) : <UserIcon />}
                            </AvatarFallback>
                        </Avatar>
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <LoaderCircle className="animate-spin text-white" />
                            </div>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background/80 backdrop-blur-sm"
                            onClick={handleAvatarChangeClick}
                            disabled={isUploading}
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
                <div className="space-y-2">
                    <Label htmlFor="username">Unique Username</Label>
                    <div className="flex gap-2">
                        <Input id="username" placeholder="e.g. javed_026" value={username} onChange={handleUsernameChange} />
                        <Button onClick={checkUsernameAvailability} disabled={isChecking || username.length < 3} variant="outline">
                            {isChecking ? <LoaderCircle className="animate-spin" /> : 'Check'}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your unique username cannot be changed later.</p>
                     {isAvailable === true && <p className="text-sm text-green-500 flex items-center gap-1"><Check className="h-4 w-4"/> Available!</p>}
                    {isAvailable === false && <p className="text-sm text-destructive flex items-center gap-1"><X className="h-4 w-4"/> Taken, try another.</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" placeholder="e.g. Javed Hussain" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                        <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                         <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                </div>
                <div className="space-y-1 pt-2">
                    <PasswordRequirement meets={isAvailable === true} text="Username is available" />
                    <PasswordRequirement meets={passLength} text="At least 8 characters" />
                    <PasswordRequirement meets={passChars} text="Contains letters and numbers" />
                    <PasswordRequirement meets={passMatch} text="Passwords match" />
                </div>
            </div>
            <div className="shrink-0 pt-4 space-y-2">
                <Button size="lg" className="w-full" onClick={handleNextClick} disabled={!isFormValid || isSaving || isUploading}>
                    {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <ArrowRight className="mr-2" />}
                    {isSaving ? 'Creating Account...' : 'Continue'}
                </Button>
            </div>
        </div>
         <ImageCropperDialog 
            imageSrc={imageToCrop}
            onClose={() => setImageToCrop(null)}
            onSave={async (croppedImage) => {
                setImageToCrop(null);
                setIsUploading(true);
                try {
                    const downloadURL = await uploadCroppedImage(croppedImage);
                    setSelectedAvatar(downloadURL);
                } catch (e) {
                    toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload avatar.' });
                } finally {
                    setIsUploading(false);
                }
            }}
        />
        </>
    );
};

const RecoverAccountStep = ({ onNext, onBack, isSaving }: { onNext: (username: string, password: string) => Promise<void>; onBack: () => void; isSaving: boolean; }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { toast } = useToast();
    
    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
        setUsername(value);
    };

    return (
        <div className="h-full w-full flex flex-col p-8 bg-background">
             <header className="shrink-0 -mx-4 -mt-4 mb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft />
                </Button>
            </header>
             <div className="text-center shrink-0">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <LogIn className="w-10 h-10 text-primary" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold mb-2 font-headline">Sign In</h2>
                <p className="text-muted-foreground mb-8">Enter your credentials to access your account.</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="recover-username">Username</Label>
                    <Input id="recover-username" placeholder="e.g. javed_026" value={username} onChange={handleUsernameChange} autoFocus />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="recover-password">Password</Label>
                    <div className="relative">
                        <Input id="recover-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                    </div>
                </div>
                <div className="text-right">
                    <Button variant="link" className="text-primary h-auto p-0" onClick={() => toast({ title: 'Feature Coming Soon', description: 'Password recovery will be implemented in a future update.'})}>
                        Forgot Password?
                    </Button>
                </div>
            </div>
             <div className="shrink-0 pt-4 space-y-2">
                <Button size="lg" className="w-full" onClick={() => onNext(username, password)} disabled={username.length < 3 || password.length < 8 || isSaving}>
                    {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <LogIn className="mr-2" />}
                    {isSaving ? 'Signing In...' : 'Sign In'}
                </Button>
            </div>
        </div>
    );
};

const TermsStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void; }) => {
    return (
        <div className="h-full w-full flex flex-col p-8 bg-background">
             <header className="shrink-0 -mx-4 -mt-4 mb-4">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft />
                </Button>
            </header>
            <div className="text-center shrink-0 mb-4">
                <h2 className="text-2xl font-bold mb-2 font-headline">Conditions of Use</h2>
                <p className="text-muted-foreground">Please read and agree to continue.</p>
            </div>
            <Card className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-6 text-sm text-muted-foreground">
                    <h3 className="font-bold text-foreground mb-2">Conditions of Use – Secure Talk</h3>
                    <p className="mb-4">Welcome to Secure Talk. By creating an account or using this application, you agree to the following terms and conditions. Please read them carefully before proceeding. If you do not agree with any part of these conditions, you must not use this application.</p>
                    
                    <h3 className="font-bold text-foreground mb-2">1. Purpose of the App</h3>
                    <p className="mb-4">Secure Talk is designed to provide a private, encrypted, and user-controlled messaging experience. Our goal is to give users a safe platform to communicate without unnecessary data collection or tracking. You are solely responsible for how you use this service.</p>

                    <h3 className="font-bold text-foreground mb-2">2. Legal and Responsible Use</h3>
                    <p className="mb-4">You agree not to use Secure Talk for any illegal, harmful, or abusive purposes, including but not limited to:</p>
                    <ul className="list-disc list-inside mb-4 space-y-1">
                        <li>Spreading or planning violence, hate, or harassment.</li>
                        <li>Engaging in fraud, scams, or identity theft.</li>
                        <li>Sharing or distributing illegal, harmful, or copyrighted content.</li>
                        <li>Attempting to exploit, hack, or interfere with the app’s services or other users.</li>
                    </ul>
                    <p className="mb-4">We reserve the right to suspend or terminate accounts involved in such activities and cooperate with law enforcement if required by applicable law.</p>
                    
                    <h3 className="font-bold text-foreground mb-2">4. User Responsibility</h3>
                    <p className="mb-4">All communication and content shared through Secure Talk is the responsibility of the user who sends it. You must ensure that your use of the service complies with all applicable laws and regulations in your country. Secure Talk and its developers are not liable for any misuse of the platform by its users.</p>
                </ScrollArea>
            </Card>
            <div className="shrink-0 mt-4 space-y-2">
                <p className="text-xs text-muted-foreground text-center pb-2">
                    By tapping “Accept,” you confirm that you have read, understood, and agree to these Conditions of Use.
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" variant="outline" onClick={onBack}>
                        <ArrowLeft className="mr-2" /> Decline
                    </Button>
                    <Button size="lg" onClick={onNext}>
                        Accept & Continue
                    </Button>
                </div>
            </div>
        </div>
    );
};


export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
    const { toast } = useToast();
    const { auth, firestore, user } = useFirebase();
    const [step, setStep] = useState(0);
    const [flow, setFlow] = useState<'create' | 'recover' | null>(null);

    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    const handleNavigation = (target: 'create' | 'recover') => {
        setFlow(target);
        setStep(2);
    };
    
    const handleInitialNext = () => {
        setStep(1);
    }

    const handleCreateAccount = async (username: string, fullName: string, password: string, avatar: string) => {
        if (!auth || !firestore) return;
        setIsSavingProfile(true);
        
        const email = `${username.toLowerCase()}@secure-talk.app`;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            const batch = writeBatch(firestore);
            
            const userRef = doc(firestore, 'users', newUser.uid);
            const profileData = {
                id: newUser.uid,
                name: fullName,
                username: username.toLowerCase(),
                profilePictureUrl: avatar,
                bio: `Just joined Secure Talk!`,
                language: 'en',
                lastConnection: null,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
            };
            batch.set(userRef, profileData);

            const usernameRef = doc(firestore, 'usernames', username.toLowerCase());
            batch.set(usernameRef, { uid: newUser.uid });

            const devId = '4YaPPGcDw2NLe31LwT05h3TihTz1';
            const devDocRef = doc(firestore, 'users', devId);
            const devDoc = await getDocumentNonBlocking(devDocRef);
             if (devDoc && devDoc.exists()) {
                const devData = devDoc.data();
                const userContactRef = doc(firestore, 'users', newUser.uid, 'contacts', devId);
                batch.set(userContactRef, {
                    id: devId, name: devData.name, avatar: devData.profilePictureUrl, bio: devData.bio,
                    language: 'en', verified: true, lastMessageTimestamp: serverTimestamp(),
                }, { merge: true });
                const devContactRef = doc(firestore, 'users', devId, 'contacts', newUser.uid);
                batch.set(devContactRef, {
                    id: newUser.uid, name: profileData.name, avatar: profileData.profilePictureUrl,
                    bio: profileData.bio, language: 'en', verified: false, lastMessageTimestamp: serverTimestamp(),
                }, { merge: true });
            }

            await batch.commit();
            
            toast({ title: "Account created successfully!" });
            setStep(s => s + 1);

        } catch (error: any) {
            console.error("Account creation failed:", error);
            const message = error.code === 'auth/email-already-in-use' 
                ? 'This username is already taken.'
                : 'Could not create account.';
            toast({ variant: "destructive", title: "Creation Failed", description: message });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleRecoverAccount = async (username: string, password: string) => {
        if (!auth) return;
        setIsSigningIn(true);
        const email = `${username.toLowerCase()}@secure-talk.app`;
        try {
            // CRITICAL FIX: Await the sign-in process
            await signInWithEmailAndPassword(auth, email, password);
            toast({ title: 'Welcome back!' });
            // onComplete will be called by the auth state listener in the main layout,
            // which is the correct pattern. No need to call it here.
        } catch (error) {
            console.error("Sign in failed:", error);
            toast({ variant: 'destructive', title: 'Sign In Failed', description: 'Please check your username and password.'});
        } finally {
            setIsSigningIn(false);
        }
    };
    
    // This effect listens for the user object to become available after sign-in/sign-up
    // and then completes the onboarding flow.
    useEffect(() => {
        if (user) {
            onComplete();
        }
    }, [user, onComplete]);

    const renderStep = () => {
        if (step === 0) {
            return <InitialWelcomeStep onNext={handleInitialNext} />;
        }
        if (step === 1) {
            return <WelcomeStep onNavigate={handleNavigation} isSigningIn={isSigningIn} />;
        }
        if (step === 2 && flow === 'create') {
            return <CreateAccountStep onNext={handleCreateAccount} onBack={() => setStep(1)} isSaving={isSavingProfile} />;
        }
        if (step === 2 && flow === 'recover') {
            return <RecoverAccountStep onNext={handleRecoverAccount} onBack={() => setStep(1)} isSaving={isSigningIn} />;
        }
        if (step === 3 && flow === 'create') {
            return <TermsStep onNext={onComplete} onBack={() => setStep(2)} />;
        }
    };

    return (
        <div className="h-full w-full fixed inset-0 z-[60] bg-background">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step + (flow || '')}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="h-full w-full"
                >
                    {renderStep()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
