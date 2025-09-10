'use client';

import { useState } from 'react';
import { useDocument } from '@/context/DocumentContext';
import { LegalClause } from '@/types';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  BookOpenIcon,
  ClipboardIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

export default function DocumentViewer() {
  const { document } = useDocument();
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);
  const [showFullDocument, setShowFullDocument] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!document) {
    return null;
  }

  const copyAnalysisToClipboard = async () => {
    const analysisText = document.clauses
      .sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      })
      .map(clause => {
        return `${clause.category} (${clause.riskLevel.toUpperCase()} RISK)
${clause.explanation}

Key Points:
${clause.keyPoints.map(point => `• ${point}`).join('\n')}

Risks:
${clause.risks.map(risk => `⚠️ ${risk}`).join('\n')}

${clause.riskDetails ? `Risk Details: ${clause.riskDetails}` : ''}
${'='.repeat(50)}`;
      })
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(analysisText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportAnalysis = () => {
    const analysisText = `LegalLens Document Analysis
Generated on: ${new Date().toLocaleDateString()}

SUMMARY:
- Total Clauses: ${document.clauses.length}
- High/Medium Risks: ${document.clauses.filter(c => c.riskLevel === 'medium' || c.riskLevel === 'high').length}
- Low Risk: ${document.clauses.filter(c => c.riskLevel === 'low').length}

DETAILED ANALYSIS:
${document.clauses
  .sort((a, b) => {
    const riskOrder = { high: 3, medium: 2, low: 1 };
    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
  })
  .map(clause => {
    return `${clause.category} (${clause.riskLevel.toUpperCase()} RISK)
${clause.explanation}

Key Points:
${clause.keyPoints.map(point => `• ${point}`).join('\n')}

Risks:
${clause.risks.map(risk => `⚠️ ${risk}`).join('\n')}

${clause.riskDetails ? `Risk Details: ${clause.riskDetails}` : ''}
${'='.repeat(50)}`;
  })
  .join('\n\n')}`;

    const blob = new Blob([analysisText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `legal-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRiskBadge = (level: 'low' | 'medium' | 'high') => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (level) {
      case 'high':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <ShieldExclamationIcon className="w-4 h-4 mr-1" />
            Medium Risk
          </span>
        );
      case 'low':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Low Risk
          </span>
        );
    }
  };

  const getCategoryBadge = (category: string) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      <DocumentTextIcon className="w-4 h-4 mr-1" />
      {category}
    </span>
  );

  const renderClause = (clause: LegalClause) => {
    const isExpanded = expandedClauseId === clause.id;

    return (
      <div
        key={clause.id}
        className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300"
      >
        {/* Header - Always Visible */}
        <div
          className="p-6 cursor-pointer"
          onClick={() => setExpandedClauseId(isExpanded ? null : clause.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-2 items-center mb-3">
              {getCategoryBadge(clause.category)}
              {getRiskBadge(clause.riskLevel)}
            </div>
            <button
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="mt-2">
            <div className="text-sm text-gray-900 line-clamp-2 leading-relaxed">
              {clause.originalText}
            </div>
            <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <strong>Simple explanation:</strong> {clause.explanation}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-6 py-6 space-y-6">
            {/* Simple Explanation */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-500" />
                What this means
              </h4>
              <div className="text-sm text-gray-700 bg-blue-50 p-4 rounded-lg leading-relaxed border-l-4 border-blue-300">
                {clause.explanation}
              </div>
            </div>

            {/* Key Points */}
            {clause.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-indigo-500" />
                  Key obligations or rights
                </h4>
                <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-300">
                  <ul className="text-sm text-gray-700 space-y-2">
                    {clause.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-3 mt-0.5 text-indigo-500">•</span>
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Risks */}
            {(clause.risks.length > 0 || clause.riskDetails) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <ExclamationCircleIcon 
                    className={`w-5 h-5 mr-2 ${
                      clause.riskLevel === 'high' ? 'text-red-500' :
                      clause.riskLevel === 'medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}
                  />
                  Things to watch out for
                </h4>
                <div className={`p-4 rounded-lg border-l-4 space-y-3 ${
                  clause.riskLevel === 'high' ? 'bg-red-50 border-red-300' :
                  clause.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-300' :
                  'bg-green-50 border-green-300'
                }`}>
                  {clause.risks.map((risk, index) => (
                    <div key={index} className="flex items-start">
                      <span className="mr-3 mt-0.5 text-red-500">⚠️</span>
                      <span className={`text-sm leading-relaxed ${
                        clause.riskLevel === 'high' ? 'text-red-700' :
                        clause.riskLevel === 'medium' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {risk}
                      </span>
                    </div>
                  ))}
                  {clause.riskDetails && (
                    <div className={`mt-3 pt-3 border-t ${
                      clause.riskLevel === 'high' ? 'border-red-200' :
                      clause.riskLevel === 'medium' ? 'border-yellow-200' :
                      'border-green-200'
                    }`}>
                      <p className={`text-sm leading-relaxed ${
                        clause.riskLevel === 'high' ? 'text-red-600' :
                        clause.riskLevel === 'medium' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {clause.riskDetails}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Document Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">
            {document.clauses.length} clauses analyzed and explained
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Analysis Complete
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyAnalysisToClipboard}
              className={`flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                copySuccess 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ClipboardIcon className="w-4 h-4 mr-1" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={exportAnalysis}
              className="flex items-center px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary Stats - Prominent */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Analysis Summary</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{document.clauses.length}</div>
            <div className="text-xs text-gray-600">Total Clauses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {document.clauses.filter(c => c.riskLevel === 'medium' || c.riskLevel === 'high').length}
            </div>
            <div className="text-xs text-gray-600">Risks Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {document.clauses.filter(c => c.riskLevel === 'low').length}
            </div>
            <div className="text-xs text-gray-600">Low Risk</div>
          </div>
        </div>
      </div>

      {/* Quick Risk Overview */}
      {document.clauses.filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
            <h4 className="text-sm font-semibold text-red-800">Important Risks Detected</h4>
          </div>
          <div className="space-y-2">
            {document.clauses
              .filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium')
              .slice(0, 3)
              .map((clause) => (
                <div key={clause.id} className="text-sm text-red-700">
                  <span className="font-medium">{clause.category}:</span> {clause.explanation}
                </div>
              ))}
          </div>
          {document.clauses.filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium').length > 3 && (
            <p className="text-xs text-red-600 mt-2">
              +{document.clauses.filter(c => c.riskLevel === 'high' || c.riskLevel === 'medium').length - 3} more risks below
            </p>
          )}
        </div>
      )}
      
      {/* Clauses Grid */}
      <div className="space-y-4">
        {document.clauses
          .sort((a, b) => {
            // Sort by risk level: high > medium > low
            const riskOrder = { high: 3, medium: 2, low: 1 };
            return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
          })
          .map(renderClause)}
      </div>

      {/* Full Document Toggle */}
      <div className="border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowFullDocument(!showFullDocument)}
          className="flex items-center justify-center w-full p-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <BookOpenIcon className="w-5 h-5 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {showFullDocument ? 'Hide' : 'Show'} Full Document Text
          </span>
          {showFullDocument ? (
            <ChevronUpIcon className="w-5 h-5 ml-2 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 ml-2 text-gray-500" />
          )}
        </button>
        
        {showFullDocument && (
          <div className="mt-4 bg-gray-50 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Complete Document Text</h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {document.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 