import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'No filename or file body provided.' }, { status: 400 });
  }

  // The Vercel Blob SDK automatically picks up the BLOB_READ_WRITE_TOKEN from .env.local
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  return NextResponse.json(blob);
}
