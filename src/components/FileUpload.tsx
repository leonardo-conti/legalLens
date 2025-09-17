'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDocument } from '@/context/DocumentContext';
import { classifyClauses } from '@/utils/ai';
import { extractTextFromPDF } from '@/utils/pdfUtils';
import { LegalClause } from '@/types';

interface ProcessingStatus {
  currentStep: string;
  progress: number;
  totalSteps: number;
}

export default function FileUpload() {
  const { setDocument } = useDocument();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  const updateStatus = (step: string, progress: number, total: number) => {
    setProcessingStatus({
      currentStep: step,
      progress,
      totalSteps: total
    });
    setLoadingMessage(`${step} (${progress}/${total})`);
  };

  const processText = async (text: string) => {
    try {
      // Reset status
      setError(null);
      setProcessingStatus(null);
      
      // Step 1: Initial text processing
      updateStatus('Processing document', 1, 4);
      
      // Split text into logical sections (paragraphs, numbered items, etc.)
      const sections = text.split(/(?:\r?\n){2,}/)
        .map(section => section.trim())
        .filter(section => section.length > 0);
      
      // Step 2: Preparing sections
      updateStatus('Preparing sections', 2, 4);
      
      // Group related sections if they seem to be part of the same clause
      const processedSections = sections.reduce((acc: string[], section) => {
        const lastSection = acc[acc.length - 1];
        
        // Check if this section is likely a continuation of the previous one
        const isContinuation = 
          !section.match(/^[\d.]+|^[A-Z][\).]|^SECTION|^Article/i) && // Not a new numbered section
          lastSection &&
          !lastSection.endsWith('.'); // Previous section doesn't end with a period
        
        if (isContinuation && lastSection) {
          acc[acc.length - 1] = `${lastSection}\n${section}`;
        } else {
          acc.push(section);
        }
        
        return acc;
      }, []);

      // Step 3: Analyzing clauses
      updateStatus('Analyzing clauses', 3, 4);
      
      // Process clauses in batches to avoid overwhelming the API
      const BATCH_SIZE = 5;
      const clauses: LegalClause[] = [];
      
      for (let i = 0; i < processedSections.length; i += BATCH_SIZE) {
        const batch = processedSections.slice(i, i + BATCH_SIZE);
        const batchClauses = await classifyClauses(batch.join('\n\n---\n\n'));
        clauses.push(...batchClauses);
        
        // Update progress within the analysis step
        updateStatus(
          'Analyzing clauses',
          3,
          4,
        );
      }

      // Step 4: Finalizing
      updateStatus('Finalizing document', 4, 4);
      
      // Create the document with analyzed clauses
      setDocument({
        id: Date.now().toString(),
        content: text,
        clauses: clauses.map((clause, index) => ({
          ...clause,
          id: `clause-${index + 1}`,
        })),
      });

      // Set preview of the first few hundred characters
      setPreview(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      
      // Clear status on completion
      setProcessingStatus(null);
      setLoadingMessage('');
    } catch (err) {
      console.error('Error processing document:', err);
      setError('Failed to analyze the document. Please try again.');
      setDocument(null);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setError(null);
    setProcessingStatus(null);
    setPreview(null);

    try {
      let text: string;
      if (file.type === 'application/pdf') {
        setLoadingMessage('Extracting text from PDF...');
        text = await extractTextFromPDF(file);
      } else {
        setLoadingMessage('Reading text file...');
        text = await file.text();
      }

      if (!text.trim()) {
        throw new Error('The document appears to be empty.');
      }

      await processText(text);
    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process the file');
      setDocument(null);
    } finally {
      setIsLoading(false);
    }
  }, [setDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isLoading,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const clearFile = () => {
    setFileName(null);
    setPreview(null);
    setError(null);
    setDocument(null);
    setLoadingMessage('');
    setProcessingStatus(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
            ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <DocumentTextIcon className={`w-8 h-8 ${isDragActive ? 'text-blue-600' : 'text-gray-500'}`} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isDragActive ? "Drop your document here" : "Upload your legal document"}
          </h3>
          <p className="text-gray-600 mb-4">
            {isDragActive
              ? "Release to upload your file"
              : "Drag and drop your PDF or text file, or click to browse"}
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              PDF & TXT files
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Up to 10MB
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure upload
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing your document</h3>
            <p className="text-gray-600 mb-6">{loadingMessage}</p>
            {processingStatus && (
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>{processingStatus.currentStep}</span>
                  <span>{processingStatus.progress}/{processingStatus.totalSteps}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${(processingStatus.progress / processingStatus.totalSteps) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={clearFile}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 transition-colors"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {fileName && preview && !error && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{fileName}</h3>
                  <p className="text-sm text-gray-500">Document uploaded successfully</p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Document Preview:</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{preview}</p>
            </div>
          </div>
        </div>
      )}

      {/* Text Input Area */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Or paste your text directly</h3>
          <p className="text-sm text-gray-600">Copy and paste your legal document text below</p>
        </div>
        <textarea
          className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Paste your legal document text here..."
          onChange={async (e) => {
            const text = e.target.value.trim();
            if (text) {
              setIsLoading(true);
              await processText(text);
              setIsLoading(false);
            } else {
              clearFile();
            }
          }}
          disabled={isLoading}
        />
        <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Text will be processed automatically as you type
        </div>
      </div>
    </div>
  );
} 