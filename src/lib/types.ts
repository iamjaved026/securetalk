

import type { Timestamp } from 'firebase/firestore';

export type Attachment = {
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  name?: string;
  size?: string;
};

export type Message = {
  id: string;
  text?: string;
  attachments?: Attachment[];
  timestamp: Timestamp; // Using Firestore Timestamp
  senderId: string;
  isStarred?: boolean;
  isEdited?: boolean;
  replyTo?: string; // ID of the message being replied to
  deletedFor?: string[]; // Array of user UIDs who have deleted this message
};

export type Chat = {
    id: string;
    participants: Record<string, boolean>;
    typing: Record<string, boolean>;
    wallpaper?: string | null;
    createdAt: Timestamp;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  avatar: string;
  ownerId: string;
  participants: Record<string, boolean>;
  createdAt: Timestamp;
  permissions?: {
    editInfo: 'only_owner' | 'all_participants';
    approveMembers: 'only_owner' | 'all_participants';
    sendMessages: 'only_owner' | 'all_participants';
  };
}

export type Contact = {
  id:string; // This will be the user's UID or a group's ID
  name: string;
  displayName?: string; // User-editable nickname
  avatar: string;
  language: string;
  bio?: string;
  verified?: boolean;
  liveTranslationEnabled?: boolean;
  lastMessageTimestamp?: Timestamp;
  profilePictureUrl?: string;
  createdAt?: Timestamp; // Added this field
  call?: {
    type: 'incoming' | 'outgoing' | 'missed';
    callType: 'voice' | 'video';
    timestamp: Timestamp;
    duration?: number;
  };
  incomingCall?: {
    from: string;
    type: 'voice' | 'video';
  } | null;
  lastConnection?: string | null;
  // New fields for call state management
  callStatus?: 'connected' | 'declined' | 'ended' | null;
  callWith?: string | null; // UID of the person they are in a call with
  lastSeen?: Timestamp;
  receiveBroadcasts?: boolean;
  isPinned?: boolean;
  isArchived?: boolean; // Added for archive feature
  isGroup?: boolean; // Flag to identify if it's a group chat
};

export type UserProfile = {
    uid: string;
    name: string;
    avatar: string;
    bio: string;
    receiveBroadcasts?: boolean;
}

export type NearbyUser = {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  connectionStatus: 'none' | 'requested' | 'connected';
};

    
