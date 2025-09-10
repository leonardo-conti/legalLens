import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { DocumentProvider } from '@/context/DocumentContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LegalLens - Understand Legal Documents with AI',
  description: 'Upload legal documents and get AI-powered explanations in plain English',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DocumentProvider>
        {children}
        </DocumentProvider>
      </body>
    </html>
  );
}
