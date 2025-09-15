import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { RiggedCharacter } from '../types';
import { ICONS } from '../constants';


// Re-usable SpriteAnimation component
const SpriteAnimation: React.FC<{ rig: RiggedCharacter }> = ({ rig }) => {
    const { spriteSheetUrl, frameCount, characterName, animationType } = rig;
    const animationClassName = `sprite-viewer-${characterName.replace(/\s+/g, '-')}-${animationType.replace(/\s+/g, '-')}`;
    const frameWidth = 128;
    const frameHeight = 128;
    const style = `
      .${animationClassName} {
        width: ${frameWidth}px;
        height: ${frameHeight}px;
        background-image: url(${spriteSheetUrl});
        background-repeat: no-repeat;
        animation: play-${animationClassName} 1s steps(${frameCount}) infinite;
        transform: scale(1.2);
        image-rendering: pixelated;
        image-rendering: -moz-crisp-edges;
        image-rendering: crisp-edges;
      }
      @keyframes play-${animationClassName} {
        from { background-position: 0px 0; }
        to { background-position: -${frameWidth * frameCount}px 0; }
      }
    `;
    return (<><style>{style}</style><div className={animationClassName}></div></>);
};

type AssetType = 'all' | 'characters' | 'locations' | 'rigs' | 'story';

const CloudAssetHub: React.FC = () => {
    const { characters, locations, riggedCharacters, outline, plot, setActiveView } = useContext(AppContext);
    const [activeFolder, setActiveFolder] = useState<AssetType>('all');

    const folderCounts = {
        all: characters.length + locations.length + riggedCharacters.length + (outline ? 1 : 0) + (plot ? 1 : 0),
        characters: characters.length,
        locations: locations.length,
        rigs: riggedCharacters.length,
        story: (outline ? 1 : 0) + (plot ? 1 : 0),
    };

    const hasAssets = folderCounts.all > 0;

    const renderContent = () => {
        const showCharacters = activeFolder === 'all' || activeFolder === 'characters';
        const showLocations = activeFolder === 'all' || activeFolder === 'locations';
        const showRigs = activeFolder === 'all' || activeFolder === 'rigs';
        const showStory = activeFolder === 'all' || activeFolder === 'story';

        if (!hasAssets) {
            return (
                <div className="text-center p-12 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <ICONS.ArchiveIcon className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Asset Hub is Empty</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Use the studio modules to create assets and they will appear here.</p>
                </div>
            )
        }
        
        return (
            <div className="space-y-12">
                {showStory && (outline || plot) && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Story Elements</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {outline && (
                                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Outline: {outline.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">"{outline.logline}"</p>
                                    <button onClick={() => setActiveView('studio2D')} className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400 mt-4">View in 2D Studio &rarr;</button>
                                </div>
                            )}
                            {plot && (
                                 <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Plot: {plot.template}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">{plot.summary}</p>
                                    <button onClick={() => setActiveView('studio2D')} className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400 mt-4">View in 2D Studio &rarr;</button>
                                </div>
                            )}
                        </div>
                    </section>
                )}
                 {showCharacters && characters.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Characters ({characters.length})</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {characters.map(char => (
                                <div key={char.id} className="bg-white dark:bg-slate-800/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer" onClick={() => setActiveView('characterEngine')}>
                                    <img src={char.imageUrl} alt={char.name} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-110"/>
                                    <div className="p-3">
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{char.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {showLocations && locations.length > 0 && (
                     <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Locations ({locations.length})</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {locations.map((loc, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800/80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group cursor-pointer" onClick={() => setActiveView('studio2D')}>
                                    <img src={loc.imageUrl} alt={loc.name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"/>
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate">{loc.name}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {showRigs && riggedCharacters.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Rigged Animations ({riggedCharacters.length})</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {riggedCharacters.map((rig, index) => (
                                <div key={index} className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 group cursor-pointer" onClick={() => setActiveView('characterEngine')}>
                                    <div className="h-24 w-24 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden">
                                        <SpriteAnimation rig={rig} />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-semibold text-sm text-slate-800 dark:text-white truncate">{rig.characterName}</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{rig.animationType}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        );
    }
    
    const FolderButton: React.FC<{id: AssetType, label: string}> = ({id, label}) => (
        <button 
            onClick={() => setActiveFolder(id)}
            className={`flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors ${activeFolder === id ? 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
        >
            <span className="font-medium">{label}</span>
            <span className={`text-sm px-2 py-0.5 rounded-full ${activeFolder === id ? 'bg-fuchsia-200 dark:bg-fuchsia-800/70' : 'bg-slate-200 dark:bg-slate-700'}`}>{folderCounts[id]}</span>
        </button>
    );

    return (
        <div className="flex gap-8 items-start animate-fade-in-up">
            <aside className="w-64 bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 sticky top-8">
                <h2 className="text-lg font-bold mb-4 px-2">Folders</h2>
                <nav className="space-y-1">
                   <FolderButton id="all" label="All Assets" />
                   <FolderButton id="story" label="Story" />
                   <FolderButton id="characters" label="Characters" />
                   <FolderButton id="locations" label="Locations" />
                   <FolderButton id="rigs" label="Animations" />
                </nav>
            </aside>
            <main className="flex-1">
                {renderContent()}
            </main>
        </div>
    );
};

export default CloudAssetHub;