import { LegalDocument, LegalClause } from '@/types';

export async function classifyClauses(text: string): Promise<LegalClause[]> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'classifyClauses',
        content: text,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to classify clauses');
    }

    const data = await response.json();
    return data.clauses;
  } catch (error) {
    console.error('Error classifying clauses:', error);
    return [];
  }
}

export async function summarizeClause(): Promise<string> {
  // TODO: Implement with API route
  return 'Clause summary will be implemented soon.';
}

export async function flagRisks(): Promise<{ level: 'low' | 'medium' | 'high', details: string }> {
  // TODO: Implement with API route
  return { level: 'low', details: 'Risk assessment will be implemented soon.' };
}

export async function askQuestion(question: string, document: LegalDocument): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'askQuestion',
        content: {
          question,
          document,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get answer');
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error asking question:', error);
    return 'Sorry, I encountered an error while processing your question.';
  }
}

export async function generateSummary(): Promise<string> {
  // TODO: Implement with API route
  return 'Document summary will be implemented soon.';
} 