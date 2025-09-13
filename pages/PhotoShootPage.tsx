import React, { useState, useEffect } from 'react';
import Uploader from '../components/Uploader';
import Selector from '../components/Selector';
import ImagePreview from '../components/ImagePreview';
import Spinner from '../components/Spinner';
import { BACKGROUND_THEMES, LIGHTING_MOODS } from '../constants';
import type { UploadedImage, GeneratedResult, CustomBackgroundImage } from '../types';
import { generateEnhancedImage, generateSceneSuggestion } from '../services/geminiService';
import { SparklesIcon, LightbulbIcon, PhotographIcon, XCircleIcon } from '../components/Icons';

const SESSION_STORAGE_KEY = 'brandspark-custom-bgs';

function PhotoShootPage() {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-4 xl:col-span-3 space-y-6 p-6 glass-card rounded-xl h-fit">
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
               <div className="p-3 bg-black/20 border border-white/10 rounded-lg space-y-2">
                 <p className="text-xs text-gray-300 italic">"{sceneSuggestion}"</p>
                 <button onClick={() => setCustomPrompt(sceneSuggestion)} className="w-full text-xs text-indigo-400 font-semibold hover:text-indigo-300">
                    Apply Suggestion
                  </button>
               </div>
            )}
          </div>
        )}
        
        <div>
            <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-300 mb-2">Custom Style Prompt (Overrides selections)</label>
            <textarea 
                id="custom-prompt" rows={3} value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., A minimalist concrete slab..."
                className="w-full bg-black/20 border border-white/10 rounded-md shadow-sm p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 text-sm"
            />
        </div>
        
        <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-medium text-gray-300">Or Use Presets</h3>
            <div className="space-y-6 opacity-80 focus-within:opacity-100" title={customPrompt ? "Clear custom prompt to use dropdowns" : ""}>
                <fieldset disabled={!!customPrompt} className="space-y-6">
                    <Selector label="Background Theme" options={backgroundOptions} selectedOption={backgroundTheme} onSelectOption={setBackgroundTheme} />
                    <Selector label="Lighting Mood" options={LIGHTING_MOODS} selectedOption={lightingMood} onSelectOption={setLightingMood}/>
                </fieldset>
            </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/10">
            <label htmlFor="bg-upload-input" className="w-full cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-black/20 hover:bg-white/10 transition-colors">
                <PhotographIcon className="mr-2 h-4 w-4" />
                Upload Custom Background
            </label>
            <input id="bg-upload-input" type="file" className="sr-only" accept="image/*" onChange={handleCustomBgUpload} />
            {customBackgrounds.length > 0 && (
                 <div className="grid grid-cols-3 gap-3 mt-2 p-3 bg-black/20 rounded-lg">
                    {customBackgrounds.map((bg) => (
                        <div key={bg.id} className="relative group aspect-square">
                        <img src={bg.dataUrl} alt={bg.name} className="w-full h-full object-cover rounded-md" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => handleRemoveCustomBg(bg.id)} className="text-red-500 hover:text-red-400" aria-label="Remove background">
                                  <XCircleIcon className="w-8 h-8" />
                              </button>
                          </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || uploadedImages.length === 0}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? ( <> <Spinner /> <span className="ml-2">Generating...</span> </> ) 
          : ( <> <SparklesIcon className="mr-2 h-5 w-5" /> Generate Photos </> )}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </aside>

      <section className="lg:col-span-8 xl:col-span-9">
        {results.length > 0 ? (
          <>
            <h2 className="text-3xl font-bold mb-6 tracking-tight">Generated Results</h2>
            <ImagePreview results={results} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] glass-card rounded-xl text-center p-8 border-2 border-dashed border-white/10">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-full opacity-20 blur-2xl"></div>
              <div className="relative p-4 bg-gray-800/80 rounded-full">
                <SparklesIcon className="w-16 h-16 text-fuchsia-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Your enhanced photos will appear here</h2>
            <p className="text-gray-400 mt-2 max-w-md">Upload your product images, select a background and lighting, and click "Generate Photos" to see the magic happen.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default PhotoShootPage;