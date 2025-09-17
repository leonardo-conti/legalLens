import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { LegalClause } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Common legal document section headers
const SECTION_HEADERS = [
  'definitions',
  'term',
  'termination',
  'payment',
  'confidentiality',
  'intellectual property',
  'liability',
  'indemnification',
  'warranties',
  'governing law',
  'dispute resolution',
  'force majeure',
  'assignment',
  'notices',
  'entire agreement',
  'amendment',
  'severability',
  'waiver',
];

function splitIntoSections(text: string): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  const sections: string[] = [];
  let currentSection = '';
  for (const paragraph of paragraphs) {
    const isNumbered = /^[\d.]+\s+/.test(paragraph) || /^[a-z][.)]\s+/i.test(paragraph);
    const words = paragraph.toLowerCase().trim().split(/\s+/);
    const isHeader = SECTION_HEADERS.some(header => 
      words.join(' ').includes(header) && paragraph.length < 100
    );
    if (isNumbered || isHeader) {
      if (currentSection) {
        sections.push(currentSection.trim());
      }
      currentSection = paragraph;
    } else {
      currentSection += '\n\n' + paragraph;
    }
  }
  if (currentSection) {
    sections.push(currentSection.trim());
  }
  return sections;
}

async function classifyClauseWithClaude(text: string): Promise<LegalClause> {
  const prompt = `Analyze this legal clause and respond with ONLY valid JSON. Do not include any explanatory text before or after the JSON.

Clause text: ${text}

Respond with this exact JSON structure:
{
  "category": "Termination|Liability|Renewal|Arbitration|Payment|Privacy|Intellectual Property|Confidentiality|Force Majeure|Governing Law|Miscellaneous",
  "simpleMeaning": "Brief explanation in plain English",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "risks": ["Risk 1", "Risk 2"],
  "riskLevel": "low|medium|high",
  "riskExplanation": "Why this risk level was assigned"
}`;
  try {
    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        { role: 'user', content: prompt }
      ],
    });
    
    const rawResponse = completion.content.map(block => ('text' in block ? block.text : '')).join('');
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    
    const response = JSON.parse(jsonString);
    return {
      id: Math.random().toString(36).substring(7),
      originalText: text,
      category: response.category || 'General',
      explanation: response.simpleMeaning || 'No explanation provided',
      keyPoints: response.keyPoints || [],
      risks: response.risks || [],
      riskLevel: (response.riskLevel as 'low' | 'medium' | 'high') || 'low',
      riskDetails: response.riskExplanation || undefined,
    };
  } catch (error) {
    console.warn('Anthropic API error, falling back to mock analysis:', error);
    return mockClauseAnalysis(text);
  }
}

function mockClauseAnalysis(text: string): LegalClause {
  const lowerText = text.toLowerCase();
  let category = 'General';
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let keyPoints: string[] = [];
  let risks: string[] = [];
  if (lowerText.includes('payment') || lowerText.includes('fee') || lowerText.includes('cost')) {
    category = 'Payment';
    keyPoints = ['Involves financial obligations'];
  } else if (lowerText.includes('termination') || lowerText.includes('terminate')) {
    category = 'Termination';
    keyPoints = ['Describes how the agreement can be ended'];
  } else if (lowerText.includes('confidential') || lowerText.includes('secret')) {
    category = 'Confidentiality';
    riskLevel = 'medium';
    keyPoints = ['Involves handling of sensitive information'];
    risks = ['May require specific security measures'];
  } else if (lowerText.includes('liability') || lowerText.includes('indemnification')) {
    category = 'Liability';
    riskLevel = 'high';
    keyPoints = ['Defines legal responsibilities'];
    risks = ['May limit your legal rights'];
  } else if (lowerText.includes('intellectual property') || lowerText.includes('patent') || lowerText.includes('copyright')) {
    category = 'Intellectual Property';
    riskLevel = 'medium';
    keyPoints = ['Involves IP rights'];
    risks = ['May affect ownership of work products'];
  }
  return {
    id: Math.random().toString(36).substring(7),
    originalText: text,
    category,
    explanation: `This clause appears to be about ${category.toLowerCase()}. It's recommended to review this section carefully.`,
    keyPoints,
    risks,
    riskLevel,
    riskDetails: riskLevel !== 'low' ? 'This clause may contain important legal obligations. Professional legal review is recommended.' : undefined,
  };
}

async function mockQuestionAnswer(question: string): Promise<string> {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('what is this document')) {
    return "This appears to be a legal document. I'm currently operating in development mode without AI capabilities, but I can help you understand its basic structure.";
  } else if (lowerQuestion.includes('summary')) {
    return "I can identify different sections of this document, but for detailed analysis, you'll need to enable the Anthropic API integration.";
  } else {
    return "I'm currently running in development mode without AI capabilities. To get detailed answers about specific clauses, you'll need to set up the Anthropic API integration.";
  }
}

export async function POST(request: Request) {
  try {
    const { action, content } = await request.json();
    switch (action) {
      case 'classifyClauses': {
        const sections = splitIntoSections(content);
        const clausePromises = sections.map(section => classifyClauseWithClaude(section));
        const clauses = await Promise.all(clausePromises);
        return NextResponse.json({ clauses });
      }
      case 'askQuestion': {
        const { question, document } = content;
        try {
          const prompt = `You are a helpful legal assistant. Answer the following question about the provided legal document in plain English.\n\nDocument:\n${document.content}\n\nQuestion: ${question}`;
          const completion = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [
              { role: 'user', content: prompt }
            ],
          });
          return NextResponse.json({ 
            answer: completion.content.map(block => ('text' in block ? block.text : '')).join('')
          });
        } catch (error) {
          console.warn('Anthropic API error, falling back to mock response:', error);
          const mockAnswer = await mockQuestionAnswer(question);
          return NextResponse.json({ answer: mockAnswer });
        }
      }
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 