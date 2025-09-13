import React, { useState } from 'react';
import type { GeneratedResult, MarketingCopy, UploadedImage } from '../types';
import { DownloadIcon, SparklesIcon, DocumentDuplicateIcon, CheckIcon } from './Icons';
import { generateMarketingCopy } from '../services/geminiService';
import Spinner from './Spinner';


interface ResultsGridProps {
  results: GeneratedResult[];
}

const ImagePreview: React.FC<ResultsGridProps> = ({ results }) => {
  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {results.map((result) => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
};

interface ResultCardProps {
  result: GeneratedResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [isCopyLoading, setIsCopyLoading] = useState(false);
  const [marketingCopy, setMarketingCopy] = useState<MarketingCopy | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleDownload = () => {
    if (result.status !== 'success') return;
    const link = document.createElement('a');
    link.href = result.generatedUrl;
    link.download = `enhanced-${result.original.file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateCopy = async () => {
    setIsCopyLoading(true);
    setCopyError(null);
    setMarketingCopy(null);
    try {
      const res = await generateMarketingCopy(result.original.base64, result.original.mimeType);
      setMarketingCopy(res);
    } catch (err) {
      setCopyError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsCopyLoading(false);
    }
  };
  
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
         <div>
          <h3 className="text-sm font-semibold mb-2 text-center text-gray-300 truncate" title={result.original.file.name}>Original</h3>
          <div className="bg-gray-800 p-1 rounded-lg aspect-square flex items-center justify-center">
            <img src={result.original.dataUrl} alt="Original product" className="max-h-full max-w-full object-contain rounded" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2 text-center text-blue-400">Enhanced</h3>
          <div className="bg-gray-800 p-1 rounded-lg aspect-square flex items-center justify-center">
            {result.status === 'pending' && <Spinner />}
            {result.status === 'success' && <img src={result.generatedUrl} alt="AI Enhanced product" className="max-h-full max-w-full object-contain rounded" />}
            {result.status === 'error' && <p className="text-xs text-red-400 text-center p-2">{result.error}</p>}
          </div>
        </div>
      </div>
      
      {result.status === 'success' && (
        <>
        <div className="text-center">
            <button
            onClick={handleDownload}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
            >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download
            </button>
        </div>

        <div className="space-y-2 text-center pt-2 border-t border-gray-700">
            <button
            onClick={handleGenerateCopy}
            disabled={isCopyLoading}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
            <SparklesIcon className="mr-2 h-4 w-4" />
            {isCopyLoading ? 'Writing...' : 'AI Copywriter'}
            </button>
        </div>
        
        {copyError && (
            <div className="text-left bg-red-900/50 border border-red-700 text-red-200 px-3 py-2 rounded-md text-xs" role="alert">
            <strong className="font-bold">Error: </strong>
            <span>{copyError}</span>
            </div>
        )}

        {marketingCopy && (
            <div className="text-left p-3 bg-gray-800 rounded-lg space-y-4">
            <CopySection title="Headlines" items={marketingCopy.headlines} sectionId="headline" onCopy={handleCopyToClipboard} copiedItem={copiedItem} />
            <CopySection title="Body" items={marketingCopy.body} sectionId="body" onCopy={handleCopyToClipboard} copiedItem={copiedItem} />
            <CopySection title="Hashtags" items={[marketingCopy.hashtags.join(' ')]} sectionId="hashtags" onCopy={handleCopyToClipboard} copiedItem={copiedItem} />
            </div>
        )}
        </>
      )}
    </div>
  );
}


interface CopySectionProps {
  title: string;
  items: string[];
  sectionId: string;
  onCopy: (text: string, id: string) => void;
  copiedItem: string | null;
}

const CopySection: React.FC<CopySectionProps> = ({ title, items, sectionId, onCopy, copiedItem }) => (
  <div>
    <h4 className="text-sm font-semibold text-purple-300 mb-2">{title}</h4>
    <ul className="space-y-2">
      {items.map((item, index) => {
        const itemId = `${sectionId}-${index}`;
        const isCopied = copiedItem === itemId;
        return (
          <li key={itemId} className="flex justify-between items-start p-2 bg-gray-900/50 rounded-md">
            <p className="text-gray-300 text-xs mr-2">{item}</p>
            <button 
              onClick={() => onCopy(item, itemId)}
              title="Copy to clipboard"
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors disabled:text-green-500"
              disabled={isCopied}
            >
              {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <DocumentDuplicateIcon className="w-4 h-4" />}
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);


export default ImagePreview;
