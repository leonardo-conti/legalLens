import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, document, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document is required' }, { status: 400 });
    }

    // Build conversation context
    const systemPrompt = `You are a legal assistant helping users understand legal documents. 
    
The user has uploaded a legal document with the following clauses:
${document.clauses.map((clause: { category: string; explanation: string; originalText: string; keyPoints?: string[]; risks?: string[] }) => `
- ${clause.category}: ${clause.explanation}
  Original text: "${clause.originalText}"
  Key points: ${clause.keyPoints?.join(', ') || 'N/A'}
  Risks: ${clause.risks?.join(', ') || 'None'}
`).join('\n')}

Please answer the user's questions about this document in a helpful, clear manner. If the user asks about something not covered in the document, let them know that information isn't available in the uploaded document.`;

    // Format conversation history for Anthropic
    const messages = [
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ];

    // Call Anthropic API
    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    });

    const response = completion.content.map(block => ('text' in block ? block.text : '')).join('');

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Fallback response if API fails
    const fallbackResponse = `I apologize, but I'm having trouble processing your request right now. Please try again in a moment.`;
    
    return NextResponse.json({ response: fallbackResponse });
  }
}
