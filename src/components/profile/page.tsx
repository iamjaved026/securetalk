

'use client'

import { useState, useContext } from 'react'
import Link from 'next/link'
import { ArrowLeft, BadgeCheck, LoaderCircle, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFirebase } from '@/firebase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppContext } from '@/app/(app)/layout'

function DetailItem({ label, value }: { label: string, value: string | undefined | null }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-semibold">{value}</p>
        </div>
    )
}


export default function ProfileViewPage() {
  const { userProfile, isUserLoading } = useFirebase();
  const { setAvatarPreview } = useContext(AppContext);

  const handleAvatarClick = () => {
    if (userProfile?.profilePictureUrl) {
      setAvatarPreview({ avatarUrl: userProfile.profilePictureUrl, name: userProfile.name });
    }
  };

  if (isUserLoading) {
      return (
          <div className="flex h-full items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
      <>
        <div className="flex flex-col h-full bg-secondary/50 md:bg-card">
            <header className="flex items-center justify-between p-4 shrink-0 bg-card border-b">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                    <Link href="/settings">
                        <ArrowLeft className="h-6 w-6" />
                        <span className="sr-only">Back to Settings</span>
                    </Link>
                    </Button>
                    <h1 className="text-2xl font-bold font-headline">My Profile</h1>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/profile/edit">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Link>
                </Button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="flex flex-col items-center space-y-4 pt-4">
                    <div className="relative">
                        <button onClick={handleAvatarClick}>
                            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                                <AvatarImage src={userProfile?.profilePictureUrl} alt={userProfile?.name} data-ai-hint="person portrait" />
                                <AvatarFallback>{userProfile?.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                        </button>
                    </div>
                     <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold font-headline">{userProfile?.name}</h2>
                        {userProfile?.verified && <BadgeCheck className="h-7 w-7 text-primary" />}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>About Me</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {userProfile?.bio || "No bio set."}
                        </p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailItem label="Full Name" value={userProfile?.name} />
                        <DetailItem label="Username" value={userProfile?.username} />
                        <DetailItem label="Email" value={userProfile?.email} />
                        <DetailItem label="User ID" value={userProfile?.uid || userProfile?.id} />
                    </CardContent>
                </Card>
            </main>
        </div>
    </>
  )
}
