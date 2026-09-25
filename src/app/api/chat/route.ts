import { NextRequest, NextResponse } from 'next/server';
import { getDocuments } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 1. Get the question from the frontend
    const body = await request.json();
    const question = body.question;

    // Validate that a question was actually asked
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ error: 'Please ask a valid question.' }, { status: 400 });
    }

    // 2. Fetch all our uploaded documents from our db.json
    const docs = getDocuments();

    // 3. Simple Search Logic (Keyword Matching)
    // We break the question into individual words (keywords) and make them lowercase
    // We ignore tiny words under 3 letters (like "is", "a", "it")
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 2); 

    // We will give each document a "score" based on how many keywords it contains
    const scoredDocs = docs.map(doc => {
      let score = 0;
      const contentLower = doc.content.toLowerCase();
      
      keywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          score++;
        }
      });
      
      return { ...doc, score };
    });

    // Sort documents so the highest score is at the top
    scoredDocs.sort((a, b) => b.score - a.score);

    // 4. Get the most relevant documents (the top 2 that actually have a score > 0)
    const relevantDocs = scoredDocs.filter(doc => doc.score > 0).slice(0, 2);

    // 5. Generate a Mock AI Answer
    // As per requirements, we are making a mock response instead of paying for a real API key!
    let answer = "I couldn't find any information about that in your uploaded documents.";
    
    if (relevantDocs.length > 0) {
      // If we found matching documents, we create a fake AI response based on the top document
      answer = `Based on your documents, here is what I found regarding "${question}". (This is a simulated AI response proving that the document retrieval works!).`;
    }

    // 6. Format the sources exactly as requested in the project requirements
    const sources = relevantDocs.map(doc => ({
      _id: doc.id,
      originalName: doc.originalName
    }));

    // 7. Send the answer and sources back to the frontend
    return NextResponse.json({
      answer: answer,
      sources: sources
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: 'Something went wrong while processing your question.' }, { status: 500 });
  }
}
