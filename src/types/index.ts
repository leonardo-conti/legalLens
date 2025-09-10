export interface LegalDocument {
  id: string;
  content: string;
  clauses: LegalClause[];
  summary?: string;
}

export interface LegalClause {
  id: string;
  originalText: string;
  explanation: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskDetails?: string;
  keyPoints: string[];
  risks: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DocumentContext {
  document: LegalDocument | null;
  setDocument: (doc: LegalDocument | null) => void;
} 