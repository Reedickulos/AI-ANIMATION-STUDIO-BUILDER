import React, { useEffect, useContext } from 'react';
import {
  Dashboard,
  Studio2D,
  Studio3D,
  CharacterEngine,
  VFXCompositing,
  GenerativeVideo,
  DistributionAnalytics,
  AnimationEngine,
  CloudAssetHub,
} from './pages';
import { Header, Sidebar } from './components';
import { NAV_ITEMS } from './constants';
import { AppContext } from './contexts/AppContext';


const App: React.FC = () => {
  const { activeView, mainAction } = useContext(AppContext);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
            event.preventDefault();
            mainAction?.();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mainAction]);


  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'cloudAssetHub':
        return <CloudAssetHub />;
      case 'studio2D':
        return <Studio2D />;
      case 'studio3D':
        return <Studio3D />;
      case 'characterEngine':
        return <CharacterEngine />;
      case 'vfxCompositing':
        return <VFXCompositing />;
      case 'generativeVideo':
        return <GenerativeVideo />;
      case 'animationEngine':
        return <AnimationEngine />;
      case 'distributionAnalytics':
        return <DistributionAnalytics />;
      default:
        return <Dashboard />;
    }
  };

  const activeItem = NAV_ITEMS.find(item => item.id === activeView);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={activeItem?.label || 'Dashboard'} />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
};

export default App;