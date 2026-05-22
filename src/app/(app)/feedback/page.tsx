
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, MessageSquareWarning, Github, Mail, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Instagram } from 'lucide-react';

export default function FeedbackPage() {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Form',
        description: 'Please fill out both subject and message fields.',
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('message', message);

    try {
      const response = await fetch('https://formspree.io/f/mwpryory', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Feedback Sent!',
          description: 'Thank you for your feedback. We appreciate you helping us improve.',
        });
        setSubject('');
        setMessage('');
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: 'Could not send feedback. Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/iamjaved026/securetalk', label: 'GitHub' },
    { icon: Instagram, href: 'https://www.instagram.com/secure_talk', label: 'Instagram' },
    { icon: Mail, href: 'mailto:jvdhussain2008@gmail.com', label: 'Email' },
  ];

  return (
    <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
      <header className="flex items-center gap-4 p-4 shrink-0 bg-card border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Settings</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Report & Feedback</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Got a great idea?</CardTitle>
                <CardDescription>
                    We would love to hear it! Submit your feature suggestions via our dedicated form.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/feedback/suggest">
                        <Lightbulb className="mr-2"/>
                        Suggest a Feature
                    </Link>
                </Button>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <MessageSquareWarning className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center font-headline text-3xl">Report an Issue</CardTitle>
            <CardDescription className="text-center">
              Found a bug or something isn't working right? Let us know!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="e.g., UI glitch on chat screen"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Please describe the issue in detail."
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Bug Report'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              If you have a question or need immediate assistance, start a chat with our support team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
                <Link href="/chats/4YaPPGcDw2NLe31LwT05h3TihTz1">
                    <MessageSquare className="mr-2" />
                    Chat with the Dev Team
                </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connect With Us</CardTitle>
            <CardDescription>
              For other inquiries, you can reach out through these channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-around">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <link.icon className="w-8 h-8" />
                <span className="text-sm font-medium">{link.label}</span>
              </a>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
