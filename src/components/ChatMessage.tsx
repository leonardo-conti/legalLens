import React, { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  onRegenerate?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  content, 
  isUser, 
  timestamp, 
  onRegenerate 
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-lg p-4 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        
        <div className={`flex items-center mt-2 text-xs text-gray-500 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span className="mr-2">
            {timestamp.toLocaleTimeString()}
          </span>
          
          {!isUser && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                title="Copy message"
              >
                {isCopied ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
              
              {onRegenerate && (
                <button
                  onClick={handleRegenerate}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
