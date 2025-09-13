import React, { useState, useEffect } from 'react';
import Uploader from '../components/Uploader';
import Selector from '../components/Selector';
import Spinner from '../components/Spinner';
import { CAMPAIGN_GOALS } from '../constants';
import type { UploadedImage, CampaignPlan } from '../types';
import { generateCampaignPlan } from '../services/geminiService';
import { SparklesIcon, CalendarDaysIcon, DocumentDuplicateIcon, CheckIcon, TargetIcon, StarIcon, ChatBubbleBottomCenterTextIcon, UserGroupIcon, LightbulbIcon } from '../components/Icons';

const loadingMessages = [
  "Analyzing product...",
  "Consulting AI strategists...",
  "Building campaign timeline...",
  "Finalizing mission briefs...",
];

const themeIcons: { [key: string]: React.ReactNode } = {
  default: <LightbulbIcon className="w-6 h-6" />,
  launch: <SparklesIcon className="w-6 h-6" />,
  sale: <TargetIcon className="w-6 h-6" />,
  feature: <StarIcon className="w-6 h-6" />,
  engagement: <ChatBubbleBottomCenterTextIcon className="w-6 h-6" />,
  testimonial: <UserGroupIcon className="w-6 h-6" />,
};

const getIconForTheme = (theme: string) => {
  const lowerTheme = theme.toLowerCase();
  if (lowerTheme.includes('launch')) return themeIcons.launch;
  if (lowerTheme.includes('sale') || lowerTheme.includes('discount') || lowerTheme.includes('offer')) return themeIcons.sale;
  if (lowerTheme.includes('feature') || lowerTheme.includes('spotlight') || lowerTheme.includes('benefit')) return themeIcons.feature;
  if (lowerTheme.includes('question') || lowerTheme.includes('poll') || lowerTheme.includes('behind the scenes')) return themeIcons.engagement;
  if (lowerTheme.includes('testimonial') || lowerTheme.includes('review') || lowerTheme.includes('story')) return themeIcons.testimonial;
  return themeIcons.default;
}

function CampaignPlannerPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [campaignGoal, setCampaignGoal] = useState(CAMPAIGN_GOALS[0]);
  
  const [campaignPlan, setCampaignPlan] = useState<CampaignPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingMessage(loadingMessages[0]);
      let i = 1;
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);


  const handleImageUpload = (images: UploadedImage[]) => {
    setUploadedImage(images[0] || null);
    setCampaignPlan(null);
    setError(null);
  };
  
  const handleRemoveImage = () => {
    setUploadedImage(null);
    setCampaignPlan(null);
    setError(null);
  };
  
  const handleSubmit = async () => {
    if (!uploadedImage) {
      setError('Please upload a product image.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setCampaignPlan(null);
    
    try {
      const plan = await generateCampaignPlan(
        { base64: uploadedImage.base64, mimeType: uploadedImage.mimeType },
        campaignGoal
      );
      setCampaignPlan(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <aside className="lg:col-span-4 xl:col-span-3 space-y-6 p-6 glass-card rounded-xl h-fit">
        <h2 className="text-xl font-semibold text-gray-100">Mission Briefing</h2>
        <Uploader
          onImagesUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          uploadedImages={uploadedImage ? [uploadedImage] : []}
          isSingle={true}
        />
        
        <Selector label="Campaign Objective" options={CAMPAIGN_GOALS} selectedOption={campaignGoal} onSelectOption={setCampaignGoal}/>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading || !uploadedImage}
          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? ( <> <Spinner /> <span className="ml-2">Planning...</span> </> ) 
          : ( <> <SparklesIcon className="mr-2 h-5 w-5" /> Generate Campaign </> )}
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </aside>

      <section className="lg:col-span-8 xl:col-span-9">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] glass-card rounded-xl text-center p-8 border-2 border-dashed border-white/10">
            <Spinner />
            <h2 className="text-xl font-semibold text-gray-200 mt-4 transition-all duration-300">{loadingMessage}</h2>
            <p className="text-gray-400 mt-2">The AI is crafting your mission. Please wait.</p>
          </div>
        )}
        {campaignPlan && !isLoading && (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Campaign Timeline: <span className="text-fuchsia-400">{campaignGoal}</span></h2>
            <div className="space-y-6">
                {campaignPlan.map((day, index) => (
                <div key={index} className="animate-reveal" style={{ animationDelay: `${index * 100}ms` }}>
                    <CampaignDayCard day={day} onCopy={handleCopyToClipboard} copiedItem={copiedItem} />
                </div>
                ))}
            </div>
          </div>
        )}
        {!isLoading && !campaignPlan && (
           <div className="flex flex-col items-center justify-center h-full min-h-[60vh] glass-card rounded-xl text-center p-8 border-2 border-dashed border-white/10">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-fuchsia-600 rounded-full opacity-20 blur-2xl"></div>
              <div className="relative p-4 bg-gray-800/80 rounded-full">
                <CalendarDaysIcon className="w-16 h-16 text-blue-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Your campaign timeline will appear here</h2>
            <p className="text-gray-400 mt-2 max-w-md">Provide a product and an objective to generate your 7-day mission plan.</p>
          </div>
        )}
      </section>
    </div>
  );
}

const CampaignDayCard = ({ day, onCopy, copiedItem }: {day: CampaignPlan[0], onCopy: (text: string, id: string) => void, copiedItem: string | null}) => {
    return (
    <div className="relative p-6 rounded-xl overflow-hidden glass-card hover:border-white/20 transition-all duration-300 group">
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-gradient-to-br from-fuchsia-500/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
        <div className="flex flex-col sm:flex-row gap-6 relative">
            <div className="flex-shrink-0 flex sm:flex-col items-center gap-2 sm:gap-0 sm:space-y-2">
                <span className="text-sm font-bold text-gray-400">DAY</span>
                <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-gray-200 to-gray-400">{day.day}</span>
            </div>
            <div className="flex-1 border-t sm:border-t-0 sm:border-l border-white/10 pt-6 sm:pt-0 sm:pl-6">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-fuchsia-500/20 rounded-lg text-fuchsia-300">
                        {getIconForTheme(day.theme)}
                    </div>
                    <h3 className="text-lg font-bold text-gray-100">{day.theme}</h3>
                </div>
                <div className="space-y-4">
                    <CopyableField label="Caption" content={day.caption} fieldId={`caption-${day.day}`} onCopy={onCopy} copiedItem={copiedItem} />
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                            {day.hashtags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-gray-700/80 text-gray-300 text-xs rounded-full font-medium">{tag}</span>
                            ))}
                        </div>
                    </div>
                     <div className="p-3 rounded-md bg-blue-900/30 border-l-4 border-blue-400">
                        <h4 className="text-sm font-semibold text-blue-300">Call to Action</h4>
                        <p className="text-gray-300 text-sm mt-1">{day.callToAction}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}

const CopyableField: React.FC<{label: string, content: string, fieldId: string, onCopy: (text: string, id: string) => void, copiedItem: string | null}> = ({ label, content, fieldId, onCopy, copiedItem }) => {
    const isCopied = copiedItem === fieldId;
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <h4 className="text-sm font-semibold text-gray-300">{label}</h4>
                <button 
                    onClick={() => onCopy(content, fieldId)}
                    title="Copy to clipboard"
                    className="flex items-center text-xs font-semibold px-2 py-1 rounded-md transition-colors duration-200 disabled:cursor-default"
                    disabled={isCopied}
                >
                    {isCopied ? 
                        <><CheckIcon className="w-4 h-4 mr-1.5 text-green-400" /> <span className="text-green-400">Copied!</span></> : 
                        <><DocumentDuplicateIcon className="w-4 h-4 mr-1.5 text-gray-400" /> <span className="text-gray-400">Copy</span></>
                    }
                </button>
            </div>
            <p className="text-gray-400 text-sm p-3 bg-black/30 rounded-md border border-white/5">{content}</p>
        </div>
    );
};

export default CampaignPlannerPage;