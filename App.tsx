import React, { useState } from 'react';
import Header from './components/Header';
import Uploader from './components/Uploader';
import Selector from './components/Selector';
import ImagePreview from './components/ImagePreview';
import Spinner from './components/Spinner';
import { SparklesIcon, LightBulbIcon } from './components/Icons';
import { BACKGROUND_THEMES, LIGHTING_MOODS } from './constants';
import { enhanceProductPhoto, getStyleRecommendation } from './services/geminiService';
import type { UploadedImage, StyleRecommendation } from './types';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>(BACKGROUND_THEMES[0]);
  const [selectedLighting, setSelectedLighting] = useState<string>(LIGHTING_MOODS[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecommending, setIsRecommending] = useState<boolean>(false);
  const [recommendation, setRecommendation] = useState<StyleRecommendation | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const { imageUrl } = await enhanceProductPhoto(
        uploadedImage.base64,
        uploadedImage.mimeType,
        selectedTheme,
        selectedLighting
      );
      setGeneratedImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!uploadedImage) {
      setRecommendationError('Please upload an image first.');
      return;
    }

    setIsRecommending(true);
    setRecommendationError(null);
    setRecommendation(null);

    try {
      const result = await getStyleRecommendation(uploadedImage.base64, uploadedImage.mimeType);
      setRecommendation(result);
      setSelectedTheme(result.backgroundTheme);
      setSelectedLighting(result.lightingMood);
    } catch (err) {
      setRecommendationError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsRecommending(false);
    }
  };

  const handleImageUpload = (image: UploadedImage) => {
    setUploadedImage(image);
    setGeneratedImage(null);
    setError(null);
    setRecommendation(null);
    setRecommendationError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-800">
      {/* Control Panel */}
      <aside className="w-full md:w-80 lg:w-96 bg-gray-900 flex-shrink-0 flex flex-col">
        <Header />
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <Uploader onImageUpload={handleImageUpload} uploadedImage={uploadedImage} />
          
          <div>
            <button
              onClick={handleGetRecommendation}
              disabled={!uploadedImage || isLoading || isRecommending}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-800 bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <LightBulbIcon className="w-5 h-5 mr-2" />
              {isRecommending ? 'Analyzing...' : 'Get AI Suggestion'}
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
            disabled={!uploadedImage || isLoading || isRecommending}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            {isLoading ? 'Generating...' : 'Enhance Photo'}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 bg-gray-800">
        <div className="w-full max-w-4xl text-center">
          {isLoading && (
             <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-lg text-gray-300">AI is working its magic...</p>
              <p className="text-sm text-gray-400">This can take a moment.</p>
            </div>
          )}
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {!isLoading && !error && generatedImage && uploadedImage && (
            <ImagePreview originalImage={uploadedImage} generatedImage={generatedImage} />
          )}
           {!isLoading && !error && !generatedImage && (
             <div className="text-gray-500">
              <SparklesIcon className="mx-auto h-16 w-16" />
              <h2 className="mt-4 text-2xl font-semibold text-gray-300">Welcome to PhotoSet Pro</h2>
              <p className="mt-2">
                {uploadedImage ? 'Get an AI suggestion or select your theme and lighting, then click "Enhance Photo".' : 'Upload a product photo to get started.'}
              </p>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
