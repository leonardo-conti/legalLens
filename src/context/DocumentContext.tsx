'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { DocumentContext as DocumentContextType, LegalDocument } from '@/types';

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<LegalDocument | null>(null);

  return (
    <DocumentContext.Provider value={{ document, setDocument }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
} 