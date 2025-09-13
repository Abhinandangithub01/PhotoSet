
import React from 'react';
import type { UploadedImage } from '../types';
import { DownloadIcon } from './Icons';

interface ImagePreviewProps {
  originalImage: UploadedImage;
  generatedImage: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ originalImage, generatedImage }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `enhanced-${originalImage.file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center text-gray-300">Original</h3>
          <div className="bg-gray-800 p-2 rounded-lg aspect-square flex items-center justify-center">
            <img src={originalImage.dataUrl} alt="Original product" className="max-h-full max-w-full object-contain rounded" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-center text-blue-400">Enhanced</h3>
          <div className="bg-gray-800 p-2 rounded-lg aspect-square flex items-center justify-center">
            <img src={generatedImage} alt="AI Enhanced product" className="max-h-full max-w-full object-contain rounded" />
          </div>
        </div>
      </div>
      <div className="text-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors"
        >
          <DownloadIcon className="-ml-1 mr-3 h-5 w-5" />
          Download Enhanced Photo
        </button>
      </div>
    </div>
  );
};

export default ImagePreview;
