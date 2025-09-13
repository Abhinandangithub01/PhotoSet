import React, { useState } from 'react';
import SinglePostCreator from './SinglePostCreator';
import CampaignPlannerPage from './CampaignPlannerPage';
import { MegaphoneIcon, CalendarDaysIcon } from '../components/Icons';

type MarketingTool = 'singlePost' | 'campaignPlanner';

const MarketingPage = () => {
    const [activeTool, setActiveTool] = useState<MarketingTool>('singlePost');

    const TabButton = ({ tool, label, icon }: { tool: MarketingTool, label: string, icon: React.ReactNode }) => {
        const isActive = activeTool === tool;
        return (
        <button
            onClick={() => setActiveTool(tool)}
            className={`flex items-center space-x-2.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${
                isActive 
                ? 'text-white bg-white/10' 
                : 'text-gray-300 hover:bg-white/5'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    )};

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Marketing Suite</h1>
                <div className="flex items-center space-x-2 p-1.5 bg-gray-900/80 border border-white/10 rounded-xl">
                    <TabButton tool="singlePost" label="Single Post Creator" icon={<MegaphoneIcon className="w-5 h-5"/>} />
                    <TabButton tool="campaignPlanner" label="Campaign Planner" icon={<CalendarDaysIcon className="w-5 h-5"/>} />
                </div>
            </div>
            
            <div>
                {activeTool === 'singlePost' && <SinglePostCreator />}
                {activeTool === 'campaignPlanner' && <CampaignPlannerPage />}
            </div>
        </div>
    );
};

export default MarketingPage;