
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, LoaderCircle, Shield, Save, Megaphone, CheckCircle, Info, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function AdminUpdatePage() {
  const { firestore, userProfile } = useFirebase();
  const { toast } = useToast();

  const updateInfoRef = useMemoFirebase(() => firestore ? doc(firestore, 'app-info', 'latest') : null, [firestore]);
  const { data: updateData, isLoading } = useDoc<any>(updateInfoRef);

  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [features, setFeatures] = useState('');
  const [bugFixes, setBugFixes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (updateData) {
      setVersion(updateData.version || '');
      setTitle(updateData.title || '');
      setFeatures((updateData.features || []).join('\n'));
      setBugFixes((updateData.bugFixes || []).join('\n'));
    }
  }, [updateData]);

  const handlePublish = async () => {
    if (!version || !title) {
        toast({ variant: 'destructive', title: 'Version and title are required.' });
        return;
    }
    if (!updateInfoRef) return;

    setIsSaving(true);
    const featuresArray = features.split('\n').filter(f => f.trim() !== '');
    const bugFixesArray = bugFixes.split('\n').filter(b => b.trim() !== '');

    const dataToSave = {
        version,
        title,
        features: featuresArray,
        bugFixes: bugFixesArray,
        publishedAt: serverTimestamp(),
    };

    try {
        await setDocumentNonBlocking(updateInfoRef, dataToSave);
        toast({ title: "Update Published!", description: `Version ${version} is now live for users.` });
    } catch (error) {
        console.error("Failed to publish update:", error);
        toast({ variant: 'destructive', title: "Publish Failed", description: 'Could not save the update details.' });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile?.verified) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <Shield className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to manage app updates.</p>
        <Button asChild variant="link">
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Admin</span>
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          <h1 className="text-2xl font-bold font-headline">Publish Update</h1>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Update Details</CardTitle>
                <CardDescription>Enter the release notes for the new version. Each line in the text areas will be a separate bullet point.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="version">Version Number</Label>
                        <Input id="version" placeholder="e.g., 2.38.2" value={version} onChange={e => setVersion(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Update Title</Label>
                        <Input id="title" placeholder="e.g., The Alpha Update" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="features" className="flex items-center gap-2"><CheckCircle className="h-4 w-4"/> New Features</Label>
                    <Textarea id="features" placeholder="One feature per line..." rows={5} value={features} onChange={e => setFeatures(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bugfixes" className="flex items-center gap-2"><Bug className="h-4 w-4"/> Bug Fixes</Label>
                    <Textarea id="bugfixes" placeholder="One fix per line..." rows={5} value={bugFixes} onChange={e => setBugFixes(e.target.value)} />
                </div>
            </CardContent>
        </Card>
      </main>
      <footer className="p-4 border-t bg-card shrink-0">
          <Button className="w-full" onClick={handlePublish} disabled={isSaving}>
              {isSaving ? <LoaderCircle className="animate-spin mr-2" /> : <Save className="mr-2" />}
              {isSaving ? 'Publishing...' : 'Publish Update'}
          </Button>
      </footer>
    </div>
  );
}
