'use client';

import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Ensure we're only running this in the browser
if (typeof window !== 'undefined') {
  // Configure worker source
  GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Validate file type and size
    if (!file.type.includes('pdf')) {
      throw new Error('Please upload a valid PDF file.');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('PDF file size must be less than 10MB.');
    }

    console.log('Starting PDF extraction...');
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);

    // Create a new loading task with browser-compatible options
    const loadingTask = getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true, // Disable custom font loading
      disableRange: true, // Disable range requests
      disableStream: true, // Disable streaming
      disableAutoFetch: true, // Disable auto-fetching
    });

    console.log('PDF loading task created');

    // Get the PDF document
    const pdf = await loadingTask.promise;
    console.log(`PDF loaded successfully. Number of pages: ${pdf.numPages}`);

    let fullText = '';
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        
        // Get page text content
        const content = await page.getTextContent();
        
        // Extract text from the page
        const pageText = content.items
          .filter((item: any) => 'str' in item && typeof item.str === 'string')
          .map((item: any) => item.str)
          .join(' ')
          .trim();

        if (pageText) {
          fullText += `=== Page ${pageNum} ===\n${pageText}\n\n`;
          console.log(`Successfully extracted text from page ${pageNum}`);
        } else {
          console.log(`No text found on page ${pageNum}`);
        }

        // Clean up page resources
        page.cleanup();
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        fullText += `[Error reading page ${pageNum}]\n\n`;
      }
    }

    // Clean up PDF document
    pdf.destroy();

    const trimmedText = fullText.trim();
    if (!trimmedText) {
      throw new Error(
        'No text could be extracted from the PDF. The file might be empty, scanned, or contain only images.'
      );
    }

    console.log('PDF text extraction completed successfully');
    return trimmedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to process the PDF file. Please try again.');
  }
} 