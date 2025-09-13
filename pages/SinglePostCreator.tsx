import React, { useState } from 'react';
import Uploader from '../components/Uploader';
import Selector from '../components/Selector';
import Spinner from '../components/Spinner';
import { SOCIAL_POST_STYLES } from '../constants';
import type { UploadedImage } from '../types';
import { generateSocialPostImage } from '../services/geminiService';
import { SparklesIcon, DownloadIcon, MegaphoneIcon } from '../components/Icons';

function SinglePostCreator() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [promoText, setPromoText] = useState('50% OFF - Limited Time!');
  const [postStyle, setPostStyle] = useState(SOCIAL_POST_STYLES[0]);
  
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (images: UploadedImage[]) => {
    setUploadedImage(images[0] || null);
    setGeneratedUrl(null); // Clear previous result on new upload
    setError(null);
  };
  
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setGeneratedUrl(null);
    setError(null);
  };
  
  const handleSubmit = async () => {
    if (!uploadedImage) {
      setError('Please upload a product image.');
      return;
    }
    if (!promoText.trim()) {
      setError('Please enter some promotional text.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedUrl(null);
    
    try {
      const resultBase64 = await generateSocialPostImage(
        { base64: uploadedImage.base64, mimeType: uploadedImage.mimeType },
        promoText,
        postStyle
      );
      setGeneratedUrl(`data:image/png;base64,${resultBase64}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedUrl) return;
    const link = document.createElement('a');
    link.href = generatedUrl;
    link.download = `social-post-${uploadedImage?.file.name || 'download'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-4 xl:col-span-3 space-y-6 p-6 glass-card rounded-xl h-fit">
        <h2 className="text-xl font-semibold text-gray-100">Create Social Post</h2>
        <Uploader
          onImagesUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          uploadedImages={uploadedImage ? [uploadedImage] : []}
          isSingle={true}
        />
        
        <div>
            <label htmlFor="promo-text" className="block text-sm font-medium text-gray-300 mb-2">Promotional Text</label>
            <textarea 
                id="promo-text" rows={3} value={promoText} onChange={(e) => setPromoText(e.target.value)}
                placeholder="e.g., 50% OFF - Limited Time!"
                className="w-full bg-black/20 border border-white/10 rounded-md shadow-sm p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 text-sm"
            />
        </div>

        <Selector label="Design Style" options={SOCIAL_POST_STYLES} selectedOption={postStyle} onSelectOption={setPostStyle}/>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading || !uploadedImage}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? ( <> <Spinner /> <span className="ml-2">Generating...</span> </> ) 
          : ( <> <SparklesIcon className="mr-2 h-5 w-5" /> Generate Post </> )}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </aside>

      <section className="lg:col-span-8 xl:col-span-9">
        {uploadedImage ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center text-gray-300">Original</h3>
              <div className="bg-black/20 p-2 rounded-lg aspect-square flex items-center justify-center">
                <img src={uploadedImage.dataUrl} alt="Original product" className="max-h-full max-w-full object-contain rounded" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-center text-fuchsia-400">Social Post Ad</h3>
              <div className="bg-black/20 p-2 rounded-lg aspect-square flex items-center justify-center">
                {isLoading && <Spinner />}
                {!isLoading && generatedUrl && <img src={generatedUrl} alt="AI Generated Social Post" className="max-h-full max-w-full object-contain rounded" />}
                {!isLoading && !generatedUrl && <p className="text-gray-500 text-sm">Your ad will appear here</p>}
              </div>
              {generatedUrl && !isLoading && (
                 <button
                    onClick={handleDownload}
                    className="w-full mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors"
                    >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download Post
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] glass-card rounded-xl text-center p-8 border-2 border-dashed border-white/10">
            <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-full opacity-20 blur-2xl"></div>
                <div className="relative p-4 bg-gray-800/80 rounded-full">
                    <MegaphoneIcon className="w-16 h-16 text-indigo-400" />
                </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Create your social media post</h2>
            <p className="text-gray-400 mt-2 max-w-md">Upload a product image, add your promotional text, and choose a style to generate a custom social media ad.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default SinglePostCreator;