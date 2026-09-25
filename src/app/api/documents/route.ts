import { NextRequest, NextResponse } from 'next/server';
import { getDocuments, saveDocuments, DocumentMeta } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto'; // Built-in Node.js tool to generate random IDs

// This handles GET requests (getting the list of documents)
export async function GET() {
  const docs = getDocuments();
  
  // We sort them so the newest ones are at the top (this was a requirement!)
  const sortedDocs = docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  
  return NextResponse.json(sortedDocs);
}

// This handles POST requests (uploading a new document)
export async function POST(request: NextRequest) {
  try {
    // 1. Get the uploaded file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 2. Validate the file format (Only .txt, .md, .json allowed)
    const validExtensions = ['.txt', '.md', '.json'];
    const fileName = file.name;
    const isExtensionValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isExtensionValid) {
      return NextResponse.json({ error: 'Invalid file format. Only .txt, .md, .json are allowed.' }, { status: 400 });
    }

    // 3. Extract the text content from the file so our AI can read it later
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const content = buffer.toString('utf-8');

    // 4. Generate a random unique ID for the document
    const uniqueId = crypto.randomUUID();

    // 5. Save the physical file to our 'uploads' folder
    const uploadDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadDir, `${uniqueId}-${fileName}`);
    fs.writeFileSync(filePath, buffer);

    // 6. Create the Document details object
    const newDoc: DocumentMeta = {
      id: uniqueId,
      originalName: fileName,
      uploadDate: new Date().toISOString(),
      content: content,
    };

    // 7. Save this information to our database (db.json)
    const docs = getDocuments();
    docs.push(newDoc);
    saveDocuments(docs);

    // 8. Tell the frontend it was successful!
    return NextResponse.json({ message: 'Document uploaded successfully', document: newDoc }, { status: 201 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
