'use client';

import { useEffect, useState } from 'react';
import { useDocument } from '@/context/DocumentContext';
import { ChatMessage } from '@/types';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import ChatMessageComponent from './ChatMessage';

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

export default function ChatInterface() {
  const { document } = useDocument();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Each document gets a fresh conversation - otherwise leftover Q&A about
  // a previous document stays visible and gets sent as context to the AI
  // alongside the new document, which can produce confused answers.
  useEffect(() => {
    setMessages([]);
    setInput('');
    setChatError(null);
  }, [document?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !document || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setChatError(null);
    setIsLoading(true);

    try {
      const response = await fetchWithTimeout('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          document: document, // Send the actual document data
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
        }),
      });

      if (response.status === 429) {
        setChatError("You're sending messages too quickly. Please wait a moment and try again.");
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      if (data.isFallback) {
        setChatError('The AI assistant is running in degraded mode right now, so this answer may be less accurate than usual.');
      }
    } catch (error) {
      console.error('Failed to get response:', error);
      setChatError('Sorry, something went wrong sending your message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (messageIndex: number) => {
    if (!document || isLoading) return;

    // Find the user message that prompted this assistant response
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    setChatError(null);
    setIsLoading(true);

    try {
      const response = await fetchWithTimeout('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          document: document, // Send the actual document data
          conversationHistory: messages.slice(0, messageIndex - 1).slice(-10), // Send context up to the user message
        }),
      });

      if (response.status === 429) {
        setChatError("You're sending messages too quickly. Please wait a moment and try again.");
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to regenerate response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[messageIndex] = assistantMessage;
        return newMessages;
      });
      if (data.isFallback) {
        setChatError('The AI assistant is running in degraded mode right now, so this answer may be less accurate than usual.');
      }
    } catch (error) {
      console.error('Failed to regenerate response:', error);
      setChatError('Sorry, something went wrong regenerating that response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!document) {
    return null;
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal Assistant</h3>
            <p className="text-xs text-gray-500">Ask questions about your document</p>
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Online
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-sm text-gray-500 mb-4">Ask me anything about your legal document</p>
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              <button
                onClick={() => setInput("What are the key terms I should know?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                Key terms?
              </button>
              <button
                onClick={() => setInput("Are there any risks I should be aware of?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                Any risks?
              </button>
              <button
                onClick={() => setInput("What are my rights and obligations?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                My rights?
              </button>
              <button
                onClick={() => setInput("Can I cancel or terminate this agreement?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                Can I cancel?
              </button>
              <button
                onClick={() => setInput("What happens if I breach this contract?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                Breach consequences?
              </button>
              <button
                onClick={() => setInput("Are there any hidden fees or costs?")}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors"
              >
                Hidden fees?
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessageComponent
              key={index}
              content={message.content}
              isUser={message.role === 'user'}
              timestamp={new Date(message.timestamp)}
              onRegenerate={message.role === 'assistant' ? () => handleRegenerate(index) : undefined}
              isLoading={isLoading}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Error / degraded-mode banner */}
      {chatError && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-sm text-red-700">
          {chatError}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the document..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
