
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, Coffee, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function SupportUsPage() {
  const { toast } = useToast();

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('6207069013@ptyes');
    toast({
      title: "UPI ID Copied!",
      description: "You can now paste it into your favorite payment app.",
    });
  };
  
  const bmcLink = "https://buymeacoffee.com/iamjaved026";
  const upiQrLink = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=upi://pay?pa=6207069013@ptyes";

  return (
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/about">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to About</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Support Us</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="font-headline text-3xl">Your Support Matters</CardTitle>
            <CardDescription>We are free, ad-free, and privacy-focused.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Secure Talk is funded by our community. Your donations help us cover server costs, maintenance, and the development of new features, allowing us to stay independent and true to our mission.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buy me a Coffee</CardTitle>
            <CardDescription>If you find this app useful, consider supporting its development. Every contribution is greatly appreciated!</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
                <a href={bmcLink} target="_blank" rel="noopener noreferrer">
                    <Coffee className="mr-2" />
                    Buy me a Coffee
                </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donate via UPI (India)</CardTitle>
            <CardDescription>Scan the QR code with any UPI-enabled app.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Image
              src={upiQrLink}
              alt="UPI Donation QR Code"
              width={200}
              height={200}
              className="rounded-lg border p-2"
              data-ai-hint="qr code"
            />
            <div className='text-center'>
                <p className="text-sm text-muted-foreground">Or copy the UPI ID:</p>
                <p className="font-mono text-sm font-semibold">6207069013@ptyes</p>
            </div>
            <Button variant="outline" onClick={handleCopyUPI}>
                <Wallet className="mr-2"/>
                Copy UPI ID
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
