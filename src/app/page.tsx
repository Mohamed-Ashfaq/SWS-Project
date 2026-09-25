'use client'; // This tells Next.js this is a Frontend Component (runs in the browser)

import { useState, useEffect } from 'react';

// This defines the shape of our Document so the code knows what to expect
interface DocumentMeta {
  id: string;
  originalName: string;
  uploadDate: string;
}

export default function Dashboard() {
  // --- Document Management States ---
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Chat / AI States ---
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  // This stores the source documents the AI used to answer
  const [sources, setSources] = useState<{_id: string, originalName: string}[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

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
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // This handles what happens when you click "Delete"
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      await fetchDocuments();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  // ----- NEW: This handles asking the AI a question -----
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setChatLoading(true);
    setChatError(null);
    setAnswer(null);
    setSources([]);

    try {
      // Send the question to our AI Chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      // Update the screen with the AI's answer and the documents it used
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err: any) {
      setChatError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans pb-24">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* ----- Header Section ----- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            AI Document Assistant
          </h1>
          <p className="mt-2 text-gray-500">Upload your text files and ask questions to the AI.</p>
        </div>

        {/* ----- Upload Section ----- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Upload a Document</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
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
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm whitespace-nowrap"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <p className="text-xs text-gray-400 font-medium">Supported formats: .txt, .md, .json</p>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* ----- Document List Section (Left Side) ----- */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Documents</h2>
            
            {documents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="py-4 flex flex-col gap-2 hover:bg-gray-50 px-4 -mx-4 rounded-xl transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800 truncate" title={doc.originalName}>{doc.originalName}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(doc.uploadDate).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/documents/${doc.id}`}
                        download={doc.originalName}
                        className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ----- AI Chat Section (Right Side) ----- */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit flex flex-col">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Ask the AI</h2>
            
            <form onSubmit={handleAskQuestion} className="flex flex-col gap-3">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g. What is the login vulnerability?"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={!question.trim() || chatLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {chatLoading ? 'Searching Documents...' : 'Ask Question'}
              </button>
            </form>

            {chatError && <p className="text-red-500 text-sm mt-4">{chatError}</p>}

            {/* This is where the AI Answer shows up! */}
            {answer && (
              <div className="mt-6 p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                <h3 className="font-semibold text-purple-900 mb-2">AI Answer:</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{answer}</p>
                
                {/* This lists the documents the AI used to find the answer */}
                {sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-200/50">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sources Used:</h4>
                    <ul className="flex flex-wrap gap-2">
                      {sources.map((src, i) => (
                        <li key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 shadow-sm flex items-center gap-1">
                          📄 {src.originalName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
