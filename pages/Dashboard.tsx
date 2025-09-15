import React, { useContext } from 'react';
import { NAV_ITEMS } from '../constants';
import { AppContext } from '../contexts/AppContext';
import { NavItemType } from '../types';

interface ModuleCardInfo {
  id: NavItemType;
  description: string;
}

const Dashboard: React.FC = () => {
    const { setActiveView, outline, resetProject } = useContext(AppContext);
    
    const moduleCards: ModuleCardInfo[] = [
        { id: 'cloudAssetHub', description: 'Manage all project files with version control, cloud sync, and format support.' },
        { id: 'characterEngine', description: 'Design, rig, and generate lifelike interactive characters and avatars.' },
        { id: 'studio2D', description: 'A complete suite for 2D animation, from pre-production to final rendering.' },
        { id: 'studio3D', description: 'Craft 3D scenes with AI motion synthesis and procedural physics.' },
        { id: 'generativeVideo', description: 'Create stunning video content from text or image prompts with AI.' },
        { id: 'vfxCompositing', description: 'Add professional visual effects, from object removal to stylization.' },
        { id: 'distributionAnalytics', description: 'Automate distribution and track audience engagement across platforms.' },
    ];
    
    const features = moduleCards
      .map(card => {
        const navItem = NAV_ITEMS.find(item => item.id === card.id);
        return navItem ? { ...navItem, description: card.description } : null;
      })
      .filter(item => item !== null);

  return (
    <div className="animate-fade-in-up">
      <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-fuchsia-600 dark:from-blue-800/80 dark:via-purple-900/80 dark:to-fuchsia-900/80 border border-transparent dark:border-slate-700/50 rounded-xl p-8 md:p-12 text-center mb-8 shadow-xl shadow-purple-500/20">
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">AI Animation Suite</h1>
            <p className="text-lg text-purple-100 dark:text-purple-200 max-w-3xl mx-auto mb-6">
              This is your central hub for creating stunning animations. Select a module below to enter a specialized studio environment.
            </p>
            {outline && (
                <button 
                    onClick={resetProject}
                    className="bg-red-500 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                >
                    Start New Project
                </button>
            )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => feature && (
          <button
            key={feature.id}
            onClick={() => setActiveView(feature.id as NavItemType)}
            className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 flex flex-col items-start text-left transform hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl hover:shadow-fuchsia-500/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900"
            style={{ animationDelay: `${index * 100}ms` }}
            aria-label={`Go to ${feature.label}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-fuchsia-100 dark:bg-slate-700 text-fuchsia-500 dark:text-fuchsia-400 p-3 rounded-lg transition-colors duration-300">{React.cloneElement(feature.icon, { className: "h-7 w-7" })}</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feature.label}</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {feature.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;