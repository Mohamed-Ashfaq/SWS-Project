import { NextRequest, NextResponse } from 'next/server';
import { getDocuments, saveDocuments } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// This handles GET requests (Downloading the file)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Find the document in our database
  const docs = getDocuments();
  const document = docs.find(doc => doc.id === id);

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // 2. Find the physical file in our 'uploads' folder
  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, `${document.id}-${document.originalName}`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File physically missing from server' }, { status: 404 });
  }

  // 3. Read the file and send it back to the user as a download
  const fileBuffer = fs.readFileSync(filePath);
  
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Disposition': `attachment; filename="${document.originalName}"`,
      'Content-Type': 'application/octet-stream', // This tells the browser it's a file download
    },
  });
}

// This handles DELETE requests (Deleting the file)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Find the document in our database
  const docs = getDocuments();
  const documentIndex = docs.findIndex(doc => doc.id === id);

  if (documentIndex === -1) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const document = docs[documentIndex];

  // 2. Delete the physical file from the 'uploads' folder
  const uploadDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadDir, `${document.id}-${document.originalName}`);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // This command actually deletes the file
  }

  // 3. Remove the document from our database list
  docs.splice(documentIndex, 1);
  saveDocuments(docs);

  // 4. Send success message to frontend
  return NextResponse.json({ message: 'Document deleted successfully' });
}
