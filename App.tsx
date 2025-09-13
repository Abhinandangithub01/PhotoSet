import React, { useState } from 'react';
import Header from './components/Header';
import Uploader from './components/Uploader';
import Selector from './components/Selector';
import ImagePreview from './components/ImagePreview';
import Spinner from './components/Spinner';
import { SparklesIcon, LightBulbIcon } from './components/Icons';
import { BACKGROUND_THEMES, LIGHTING_MOODS } from './constants';
import { enhanceProductPhoto, getStyleRecommendation } from './services/geminiService';
import type { UploadedImage, StyleRecommendation, GeneratedResult } from './types';

const App: React.FC = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>(BACKGROUND_THEMES[0]);
  const [selectedLighting, setSelectedLighting] = useState<string>(LIGHTING_MOODS[0]);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<StyleRecommendation | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedResults([]); // Clear previous results

    // Initialize results with a pending state
    const initialResults: GeneratedResult[] = uploadedImages.map(img => ({
      id: img.id,
      original: img,
      generatedUrl: '',
      status: 'pending',
    }));
    setGeneratedResults(initialResults);
    
    for (let i = 0; i < uploadedImages.length; i++) {
      const image = uploadedImages[i];
      setProcessingStatus(`Enhancing ${i + 1} of ${uploadedImages.length}...`);
      try {
        const { imageUrl } = await enhanceProductPhoto(
          image.base64,
          image.mimeType,
          selectedTheme,
          selectedLighting
        );
        
        setGeneratedResults(prev => prev.map(r => r.id === image.id ? { ...r, generatedUrl: imageUrl, status: 'success' } : r));

      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setGeneratedResults(prev => prev.map(r => r.id === image.id ? { ...r, status: 'error', error: message } : r));
      }
    }

    setIsLoading(false);
    setProcessingStatus(null);
  };

  const handleGetRecommendation = async () => {
    if (uploadedImages.length === 0) {
      setRecommendationError('Please upload an image first.');
      return;
    }
    // Only use the first image for recommendation in batch mode
    const firstImage = uploadedImages[0];

    setIsRecommending(true);
    setRecommendationError(null);
    setRecommendation(null);

    try {
      const result = await getStyleRecommendation(firstImage.base64, firstImage.mimeType);
      setRecommendation(result);
      setSelectedTheme(result.backgroundTheme);
      setSelectedLighting(result.lightingMood);
    } catch (err) {
      setRecommendationError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsRecommending(false);
    }
  };

  const handleImagesUpload = (images: UploadedImage[]) => {
    setUploadedImages(prev => [...prev, ...images]);
    setGeneratedResults([]);
    setError(null);
    setRecommendation(null);
    setRecommendationError(null);
  };
  
  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  }

  const isBatchMode = uploadedImages.length > 1;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-800">
      {/* Control Panel */}
      <aside className="w-full md:w-80 lg:w-96 bg-gray-900 flex-shrink-0 flex flex-col">
        <Header />
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <Uploader onImagesUpload={handleImagesUpload} uploadedImages={uploadedImages} onRemoveImage={handleRemoveImage} />
          
          <div>
            <button
              onClick={handleGetRecommendation}
              disabled={uploadedImages.length === 0 || isLoading || isRecommending}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-800 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <LightBulbIcon className="w-5 h-5 mr-2" />
              {isRecommending ? 'Analyzing...' : `Get Suggestion ${isBatchMode ? '(from 1st)' : ''}`}
            </button>
            {recommendationError && (
                <p className="mt-2 text-sm text-red-400">{recommendationError}</p>
            )}
            {recommendation && !recommendationError && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-sm font-semibold text-yellow-300">AI Suggestion:</p>
                    <p className="mt-1 text-sm text-gray-300">{recommendation.reasoning}</p>
                </div>
            )}
          </div>

          <Selector
            label="Background Theme"
            options={BACKGROUND_THEMES}
            selectedOption={selectedTheme}
            onSelectOption={setSelectedTheme}
          />
          <Selector
            label="Lighting Mood"
            options={LIGHTING_MOODS}
            selectedOption={selectedLighting}
            onSelectOption={setSelectedLighting}
          />
        </div>
        <div className="p-6 border-t border-gray-700">
          <button
            onClick={handleGenerate}
            disabled={uploadedImages.length === 0 || isLoading || isRecommending}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Generating...' : `Enhance ${uploadedImages.length > 0 ? uploadedImages.length : ''} Photo${isBatchMode || uploadedImages.length === 0 ? 's' : ''}`}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-800">
        <div className="w-full max-w-7xl mx-auto text-center">
          {isLoading && (
             <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-lg text-gray-300">{processingStatus || 'AI is working its magic...'}</p>
              <p className="text-sm text-gray-400">Please wait, this may take a few moments.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {!isLoading && !error && generatedResults.length > 0 && (
            <ImagePreview results={generatedResults} />
          )}
           {!isLoading && !error && generatedResults.length === 0 && (
             <div className="text-gray-500">
              <SparklesIcon className="mx-auto h-16 w-16" />
              <h2 className="mt-4 text-2xl font-semibold text-gray-300">Welcome to PhotoSet Pro</h2>
              <p className="mt-2">
                {uploadedImages.length > 0 ? 'Select your theme and lighting, then click "Enhance Photos".' : 'Upload one or more product photos to get started.'}
              </p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
