import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Uploader from './components/Uploader';
import Selector from './components/Selector';
import ImagePreview from './components/ImagePreview';
import Spinner from './components/Spinner';
import { BACKGROUND_THEMES, LIGHTING_MOODS } from './constants';
import type { UploadedImage, GeneratedResult, CustomBackgroundImage } from './types';
import { generateEnhancedImage, generateSceneSuggestion } from './services/geminiService';
import { SparklesIcon, LightbulbIcon, PhotographIcon, XCircleIcon } from './components/Icons';

const SESSION_STORAGE_KEY = 'photoset-pro-custom-bgs';

function App() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackgroundImage[]>(() => {
    try {
      const storedBgs = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return storedBgs ? JSON.parse(storedBgs) : [];
    } catch (e) {
      console.error("Failed to parse custom backgrounds from session storage", e);
      return [];
    }
  });
  
  const [backgroundTheme, setBackgroundTheme] = useState(BACKGROUND_THEMES[0]);
  const [lightingMood, setLightingMood] = useState(LIGHTING_MOODS[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [sceneSuggestion, setSceneSuggestion] = useState<string | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(customBackgrounds));
    } catch (e) {
      console.error("Failed to save custom backgrounds to session storage", e);
    }
  }, [customBackgrounds]);

  const handleImagesUpload = (newImages: UploadedImage[]) => {
    setUploadedImages(prev => [...prev, ...newImages]);
    setResults([]);
    setSceneSuggestion(null);
    setSuggestionError(null);
  };
  
  const handleCustomBgUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const [header, base64] = dataUrl.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
        const newBg: CustomBackgroundImage = {
            id: crypto.randomUUID(),
            name: file.name,
            dataUrl,
            base64,
            mimeType
        };
        setCustomBackgrounds(prev => [...prev, newBg]);
    };
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => {
      const remaining = prev.filter(image => image.id !== id);
      if (remaining.length !== 1) {
        setSceneSuggestion(null);
        setSuggestionError(null);
      }
      return remaining;
    });
  };

  const handleRemoveCustomBg = (id: string) => {
    const bgToRemove = customBackgrounds.find(bg => bg.id === id);
    // If the currently selected theme is the one being removed, reset to default
    if (bgToRemove && `Custom: ${bgToRemove.name}` === backgroundTheme) {
        setBackgroundTheme(BACKGROUND_THEMES[0]);
    }
    setCustomBackgrounds(prev => prev.filter(bg => bg.id !== id));
  };

  const handleSuggestScene = async () => {
    if (uploadedImages.length !== 1) return;
    setIsSuggestionLoading(true);
    setSuggestionError(null);
    setSceneSuggestion(null);
    try {
      const suggestion = await generateSceneSuggestion(uploadedImages[0].base64, uploadedImages[0].mimeType);
      setSceneSuggestion(suggestion);
    } catch (err) {
      setSuggestionError(err instanceof Error ? err.message : 'Failed to get suggestion.');
    } finally {
      setIsSuggestionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (uploadedImages.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResults(uploadedImages.map(img => ({ id: img.id, original: img, status: 'pending' })));

    const isCustomBg = backgroundTheme.startsWith('Custom: ');
    let customBgData: CustomBackgroundImage | undefined;
    if (isCustomBg) {
        const bgName = backgroundTheme.replace('Custom: ', '');
        customBgData = customBackgrounds.find(bg => bg.name === bgName);
    }
    
    const generationPrompt = customPrompt.trim() || (isCustomBg ? lightingMood : `${backgroundTheme} with ${lightingMood} lighting`);

    for (const image of uploadedImages) {
        try {
            const resultBase64 = await generateEnhancedImage(
                { base64: image.base64, mimeType: image.mimeType },
                generationPrompt,
                customBgData ? { base64: customBgData.base64, mimeType: customBgData.mimeType } : undefined
            );
            const generatedUrl = `data:image/png;base64,${resultBase64}`;
            setResults(prev => prev.map(r => r.id === image.id ? { ...r, status: 'success', generatedUrl } : r));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setResults(prev => prev.map(r => r.id === image.id ? { ...r, status: 'error', error: errorMessage } : r));
        }
    }

    setIsLoading(false);
  };

  const backgroundOptions = [
      ...BACKGROUND_THEMES,
      ...customBackgrounds.map(bg => `Custom: ${bg.name}`)
  ];

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <aside className="lg:col-span-4 xl:col-span-3 space-y-6 p-6 bg-gray-900/50 border border-gray-700 rounded-lg h-fit">
            <h2 className="text-xl font-semibold text-gray-100">Customize Your Scene</h2>
            <Uploader
              onImagesUpload={handleImagesUpload}
              onRemoveImage={handleRemoveImage}
              uploadedImages={uploadedImages}
            />

            {uploadedImages.length === 1 && (
              <div className="space-y-3">
                <button
                  onClick={handleSuggestScene}
                  disabled={isSuggestionLoading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-purple-500 text-sm font-medium rounded-md shadow-sm text-purple-300 bg-purple-900/30 hover:bg-purple-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-500 transition-colors"
                >
                  {isSuggestionLoading ? ( <> <Spinner /> <span className="ml-2">Getting suggestion...</span> </> ) 
                  : ( <> <LightbulbIcon className="mr-2 h-4 w-4" /> Suggest a Scene </> )}
                </button>
                {suggestionError && <p className="text-xs text-red-400">{suggestionError}</p>}
                {sceneSuggestion && (
                   <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg space-y-2">
                     <p className="text-xs text-gray-300 italic">"{sceneSuggestion}"</p>
                     <button onClick={() => setCustomPrompt(sceneSuggestion)} className="w-full text-xs text-blue-400 font-semibold hover:text-blue-300">
                        Apply Suggestion
                      </button>
                   </div>
                )}
              </div>
            )}
            
            <div>
                <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300 mb-1">Custom Style Prompt (Overrides selections)</label>
                <textarea 
                    id="custom-prompt" rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., A minimalist concrete slab with harsh studio lighting..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-sm"
                />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-medium text-gray-300">Scene Settings</h3>
                <div className="space-y-6 opacity-80 focus-within:opacity-100" title={customPrompt ? "Clear custom prompt to use dropdowns" : ""}>
                    <fieldset disabled={!!customPrompt} className="space-y-6">
                        <Selector label="Background Theme" options={backgroundOptions} selectedOption={backgroundTheme} onSelectOption={setBackgroundTheme} />
                        <Selector label="Lighting Mood" options={LIGHTING_MOODS} selectedOption={lightingMood} onSelectOption={setLightingMood}/>
                    </fieldset>
                </div>
            </div>

            <div className="space-y-3">
                <label htmlFor="bg-upload-input" className="w-full cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors">
                    <PhotographIcon className="mr-2 h-4 w-4" />
                    Upload Custom Background
                </label>
                <input id="bg-upload-input" type="file" className="sr-only" accept="image/*" onChange={handleCustomBgUpload} />
                {customBackgrounds.length > 0 && (
                     <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-gray-800 rounded-lg">
                        {customBackgrounds.map((bg) => (
                            <div key={bg.id} className="relative group">
                            <img src={bg.dataUrl} alt={bg.name} className="w-full h-20 object-cover rounded-md" />
                            <button onClick={() => handleRemoveCustomBg(bg.id)} className="absolute -top-2 -right-2 bg-gray-800 rounded-full text-red-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" aria-label="Remove background">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading || uploadedImages.length === 0}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? ( <> <Spinner /> <span className="ml-2">Generating...</span> </> ) 
              : ( <> <SparklesIcon className="mr-2 h-5 w-5" /> Generate Photos </> )}
            </button>
            {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
          </aside>

          <section className="lg:col-span-8 xl:col-span-9">
            {results.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-4 tracking-tight">Generated Results</h2>
                <ImagePreview results={results} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[50vh] bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg text-center p-8">
                <SparklesIcon className="w-16 h-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-semibold text-gray-300">Your enhanced photos will appear here</h2>
                <p className="text-gray-500 mt-2 max-w-md">Upload your product images, select a background and lighting, and click "Generate Photos" to see the magic happen.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
