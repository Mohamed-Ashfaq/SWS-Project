'use client'; // This tells Next.js this is a Frontend Component (runs in the browser)

import { useState, useEffect } from 'react';

// This defines the shape of our Document so the code knows what to expect
interface DocumentMeta {
  id: string;
  originalName: string;
  uploadDate: string;
}

export default function Dashboard() {
  // These are "states" that remember information while the user is on the page
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This runs automatically when the page first loads to fetch our documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Helper function to ask our GET API for the list of documents
  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  // This handles what happens when you click the "Upload" button
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the page from refreshing
    if (!file) return;

    setLoading(true);
    setError(null);

    // We pack the file into a "FormData" object (like a digital envelope)
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Send the file to our POST API
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      // If successful, reset the file input so they can upload another
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      
      // Refresh the list of documents on the screen
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // This handles what happens when you click "Delete"
  const handleDelete = async (id: string) => {
    // Ask for confirmation first!
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Tell our DELETE API to remove it
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      // Refresh the list
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ----- Header Section ----- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Document Management Dashboard
          </h1>
          <p className="mt-2 text-gray-500">Upload your text files and manage them easily.</p>
        </div>

        {/* ----- Upload Section ----- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload a Document</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <input
                id="file-upload"
                type="file"
                accept=".txt,.md,.json"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 transition-all cursor-pointer"
              />
              <button
                type="submit"
                disabled={!file || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm whitespace-nowrap"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs text-gray-400 font-medium">Supported formats: .txt, .md, .json</p>
          </form>
        </div>

        {/* ----- Document List Section ----- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Documents</h2>
          
          {documents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
              <p className="text-gray-400 text-sm mt-1">Upload one above to get started!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <li key={doc.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-4 -mx-4 rounded-xl transition-colors">
                  <div>
                    <p className="font-semibold text-gray-800">{doc.originalName}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(doc.uploadDate).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-3">
                    {/* The Download Button links directly to our GET API */}
                    <a
                      href={`/api/documents/${doc.id}`}
                      download={doc.originalName}
                      className="px-4 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-4 py-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
