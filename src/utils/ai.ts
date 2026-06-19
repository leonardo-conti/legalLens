import { LegalDocument, LegalClause } from '@/types';

const REQUEST_TIMEOUT_MS = 30000;

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function classifyClauses(text: string): Promise<LegalClause[]> {
  const response = await fetchWithTimeout('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'classifyClauses',
      content: text,
    }),
  });

  // Let errors propagate instead of swallowing them into an empty array -
  // the caller (FileUpload) already shows whatever message is thrown here,
  // so silently returning [] would hide the real reason (rate limit,
  // timeout, server error, ...) and look like "no clauses found."
  if (response.status === 429) {
    throw new Error("You're uploading documents too quickly. Please wait a moment and try again.");
  }
  if (!response.ok) {
    throw new Error('Failed to classify clauses. Please try again.');
  }

  const data = await response.json();
  return data.clauses;
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
    const response = await fetchWithTimeout('/api/ai', {
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