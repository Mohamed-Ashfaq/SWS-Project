import fs from 'fs';
import path from 'path';

// This describes exactly what a "Document" looks like in our app
export interface DocumentMeta {
  id: string; // A unique ID (like a barcode)
  originalName: string; // The file name the user uploaded (e.g. policy.txt)
  uploadDate: string; // When the file was uploaded
  content: string; // The text inside the file (we save this here to search later)
}

// The path to our simple text file database
const DB_PATH = path.join(process.cwd(), 'db.json');

// Helper function to get all documents from the database
export function getDocuments(): DocumentMeta[] {
  // If the file doesn't exist yet, just return an empty list
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  
  // Read the text from the file
  const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
  
  // Convert the text back into a list of documents and return it
  return JSON.parse(fileContent);
}

// Helper function to save documents back to the database
export function saveDocuments(docs: DocumentMeta[]) {
  // Convert the list into formatted text and save it to the file
  fs.writeFileSync(DB_PATH, JSON.stringify(docs, null, 2), 'utf-8');
}
