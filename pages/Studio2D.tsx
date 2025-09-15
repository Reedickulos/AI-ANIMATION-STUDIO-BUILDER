

import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import { generateOutline, generatePlot, generateImage, generateStoryboardPanelInfo, generateVoiceoverScript } from '../services/geminiService';
import { Spinner, SpeechRecognitionButton, CustomSelect } from '../components';
import { ICONS, GENRE_OPTIONS, TONE_OPTIONS, AUDIENCE_OPTIONS, ART_STYLE_OPTIONS, MOOD_OPTIONS, SCRIPT_TONE_OPTIONS } from '../constants';
import { StoryboardPanel } from '../types';

// --- Submodule: Outline Creator ---
const OutlineCreator: React.FC = () => {
    const { outline, setOutline, registerMainAction, setIsDirty } = useContext(AppContext);
    const [prompt, setPrompt] = useState('');
    const [genre, setGenre] = useState(GENRE_OPTIONS[0]);
    const [tone, setTone] = useState(TONE_OPTIONS[0]);
    const [targetAudience, setTargetAudience] = useState(AUDIENCE_OPTIONS[2]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const hasUnsavedChanges = prompt.trim() !== '' && !outline;
        setIsDirty(hasUnsavedChanges);
    }, [prompt, outline, setIsDirty]);

    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a core idea for your story.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateOutline(prompt, genre, tone, targetAudience);
            if (result) {
                setOutline(result);
                setPrompt('');
            } else {
                setError('Failed to generate outline. The AI returned an invalid format.');
            }
        } catch (e) {
            setError('An error occurred while communicating with the AI.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, genre, tone, targetAudience, setOutline]);

    useEffect(() => {
        registerMainAction(handleGenerate);
        return () => registerMainAction(null);
    }, [handleGenerate, registerMainAction]);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">Create Story Outline</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Describe your core idea to generate a 3-act story structure.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Core Idea (or dictate)</label>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A lonely robot in a post-apocalyptic world finds the last living flower and must protect it."
                                className="w-full p-3 pr-12 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                                rows={3}
                            />
                            <div className="absolute top-2 right-2"><SpeechRecognitionButton onTranscriptUpdate={(t) => setPrompt(p => p + t)} /></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CustomSelect id="genre" label="Genre" options={GENRE_OPTIONS} value={genre} onChange={setGenre} />
                        <CustomSelect id="tone" label="Tone" options={TONE_OPTIONS} value={tone} onChange={setTone} />
                        <CustomSelect id="audience" label="Target Audience" options={AUDIENCE_OPTIONS} value={targetAudience} onChange={setTargetAudience} />
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isLoading || !prompt} className="mt-6 px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">
                    {isLoading ? <Spinner /> : 'Generate Outline'}
                </button>
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
            {outline && (
                <div className="bg-white dark:bg-slate-800/80 p-6 animate-fade-in-up space-y-4 shadow-md rounded-xl">
                    <h3 className="text-2xl font-bold text-fuchsia-600">{outline.title}</h3>
                    <p className="italic text-slate-600 dark:text-slate-300">"{outline.logline}"</p>
                    {outline.acts.map(act => (
                        <div key={act.act} className="pt-4">
                            <h4 className="font-bold text-lg">{`Act ${act.act}: ${act.title}`}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{act.summary}</p>
                            <ul className="list-decimal list-inside space-y-1 pl-4">
                                {act.scenes.map(scene => <li key={scene.scene}>{scene.description}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Submodule: Plot Engine ---
const PlotEngine: React.FC = () => {
    const { outline, plot, setPlot } = useContext(AppContext);
    const [template, setTemplate] = useState("Hero's Journey");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!outline) {
            setError('Please generate an outline first.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generatePlot(outline.title, outline.logline, template);
            if (result) setPlot(result);
            else setError('Failed to generate plot.');
        } catch (e) {
            setError('An error occurred while generating the plot.');
        } finally {
            setIsLoading(false);
        }
    }, [outline, template, setPlot]);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">Flesh out your Plot</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Choose a narrative template to expand your outline into a detailed plot.</p>
                 {!outline ? (
                    <p className="text-amber-500 bg-amber-500/10 p-3 rounded-lg">Please create an outline on the "Outline" tab first.</p>
                ) : (
                    <div className="flex items-end gap-4">
                        <div>
                            <label htmlFor="template-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Plot Template</label>
                            <select id="template-select" value={template} onChange={e => setTemplate(e.target.value)} className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg">
                                <option>Hero's Journey</option>
                                <option>Three-Act Structure</option>
                                <option>Fichtean Curve</option>
                                <option>Save the Cat</option>
                            </select>
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading} className="px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">
                             {isLoading ? <Spinner /> : 'Generate Plot'}
                        </button>
                    </div>
                )}
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
             {plot && (
                <div className="bg-white dark:bg-slate-800/80 p-6 animate-fade-in-up space-y-4 shadow-md rounded-xl">
                    <h3 className="text-2xl font-bold text-fuchsia-600">{plot.title} ({plot.template})</h3>
                    <p className="text-slate-600 dark:text-slate-300">{plot.summary}</p>
                     {plot.acts.map(act => (
                        <div key={act.act} className="pt-4">
                            <h4 className="font-bold text-lg">{`Act ${act.act}: ${act.title}`}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{act.summary}</p>
                            <ul className="list-disc list-inside space-y-2 pl-4">{act.plotPoints.map((pp, i) => <li key={i}>{pp}</li>)}</ul>
                        </div>
                    ))}
                    {plot.twist && <div className="pt-4"><h4 className="font-bold text-lg">Twist</h4><p>{plot.twist}</p></div>}
                    {plot.resolution && <div className="pt-4"><h4 className="font-bold text-lg">Resolution</h4><p>{plot.resolution}</p></div>}
                </div>
            )}
        </div>
    );
};

// --- Submodule: Location Creator ---
const LocationCreator: React.FC = () => {
    const { locations, addLocation, setIsDirty } = useContext(AppContext);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [artStyle, setArtStyle] = useState(ART_STYLE_OPTIONS[0]);
    const [mood, setMood] = useState(MOOD_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        const hasUnsavedChanges = name.trim() !== '' || description.trim() !== '';
        setIsDirty(hasUnsavedChanges);
    }, [name, description, setIsDirty]);

    const handleGenerate = useCallback(async () => {
        if (!name || !description) {
            setError('Please provide a name and description.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const prompt = `Concept art for a location named "${name}". Style: ${artStyle}, Mood: ${mood}. Description: ${description}. Cinematic lighting, epic scale, high detail.`
            const imageUrl = await generateImage(prompt);
            if (imageUrl) {
                addLocation({ name, description, imageUrl });
                setName('');
                setDescription('');
                setIsDirty(false);
            } else {
                setError('Failed to generate location image.');
            }
        } catch(e) {
            setError('Error generating location.');
        } finally {
            setIsLoading(false);
        }
    }, [name, description, artStyle, mood, addLocation, setIsDirty]);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">Create Locations</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Generate concept art for the key locations in your story.</p>
                <div className="space-y-4">
                     <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Location Name (e.g., The Crystal Caves)" className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                     <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (e.g., a massive underground cavern filled with glowing crystals...)" className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg" rows={3}/>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CustomSelect id="art-style" label="Art Style" options={ART_STYLE_OPTIONS} value={artStyle} onChange={setArtStyle} />
                        <CustomSelect id="mood" label="Mood" options={MOOD_OPTIONS} value={mood} onChange={setMood} />
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isLoading || !name || !description} className="mt-6 px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">
                    {isLoading ? <Spinner/> : "Generate Location"}
                </button>
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
            {locations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {locations.map((loc, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                            <img src={loc.imageUrl} alt={loc.name} className="w-full h-64 object-cover"/>
                            <div className="p-4">
                                <h4 className="font-bold text-lg">{loc.name}</h4>
                                <p className="text-sm text-slate-500">{loc.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Submodule: Storyboard Creator ---
const StoryboardCreator: React.FC = () => {
    const { outline, storyboard, addStoryboardPanel, setIsDirty } = useContext(AppContext);
    const [selectedScene, setSelectedScene] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allScenes = outline?.acts.flatMap(act => act.scenes) || [];

    useEffect(() => {
        setIsDirty(false); // Storyboard generation is transactional
    }, [setIsDirty]);

    const handleGenerate = useCallback(async () => {
        const sceneInfo = allScenes.find(s => s.scene === selectedScene);
        if (!sceneInfo) {
            setError('Please select a valid scene.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const panelInfo = await generateStoryboardPanelInfo(sceneInfo.description);
            if (!panelInfo) {
                throw new Error("Could not get panel info.");
            }
            const imagePrompt = `${panelInfo.shotType} of ${sceneInfo.description}. ${panelInfo.cameraMovement}. Cinematic, detailed, high-quality storyboard panel.`;
            const imageUrl = await generateImage(imagePrompt);
            if (imageUrl && panelInfo) {
                const newPanel: StoryboardPanel = {
                    scene: selectedScene,
                    description: sceneInfo.description,
                    shotType: panelInfo.shotType,
                    imageUrl,
                    cameraMovement: panelInfo.cameraMovement,
                    soundEffect: panelInfo.soundEffect,
                };
                addStoryboardPanel(newPanel);
            } else {
                setError('Failed to generate storyboard panel.');
            }
        } catch (e) {
            setError('Error generating storyboard panel.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedScene, allScenes, addStoryboardPanel]);
    
    return (
        <div className="space-y-8">
             <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">Create Storyboard</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Generate visual panels for each scene in your outline.</p>
                {!outline ? (
                    <p className="text-amber-500 bg-amber-500/10 p-3 rounded-lg">Please create an outline first.</p>
                ) : (
                    <div className="flex items-end gap-4">
                        <div>
                            <label htmlFor="scene-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Select Scene</label>
                            <select id="scene-select" value={selectedScene} onChange={e => setSelectedScene(Number(e.target.value))} className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg">
                                {allScenes.map(s => <option key={s.scene} value={s.scene}>Scene {s.scene}: {s.description.substring(0, 50)}...</option>)}
                            </select>
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading} className="px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">
                             {isLoading ? <Spinner /> : 'Generate Panel'}
                        </button>
                    </div>
                )}
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
             {storyboard.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...storyboard].sort((a,b) => a.scene - b.scene).map((panel, i) => (
                         <div key={i} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={panel.imageUrl} alt={`Scene ${panel.scene}`} className="w-full aspect-video object-cover bg-slate-200" />
                            <div className="p-4">
                                <h4 className="font-bold">Scene {panel.scene}</h4>
                                <p className="text-sm italic">"{panel.description}"</p>
                                <div className="text-xs mt-2 space-y-1">
                                    <p><b>Shot:</b> {panel.shotType}</p>
                                    <p><b>Camera:</b> {panel.cameraMovement}</p>
                                    <p><b>Sound:</b> {panel.soundEffect}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Submodule: Voice Script Writer ---
const VoiceScriptWriter: React.FC = () => {
    const { outline, characters, voiceScripts, updateVoiceScript, setIsDirty } = useContext(AppContext);
    const [selectedScene, setSelectedScene] = useState<number>(1);
    const [charactersInScene, setCharactersInScene] = useState('');
    const [tone, setTone] = useState(SCRIPT_TONE_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allScenes = outline?.acts.flatMap(act => act.scenes) || [];

    useEffect(() => {
         const hasUnsavedChanges = charactersInScene.trim() !== '';
         setIsDirty(hasUnsavedChanges);
    }, [charactersInScene, setIsDirty]);

    const handleGenerate = useCallback(async () => {
        const sceneInfo = allScenes.find(s => s.scene === selectedScene);
        if (!sceneInfo || !charactersInScene) {
            setError('Please select a scene and specify characters.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateVoiceoverScript(sceneInfo.description, charactersInScene, tone);
            if (result) {
                updateVoiceScript({ ...result, scene: selectedScene });
                setCharactersInScene('');
                setIsDirty(false);
            } else {
                setError('Failed to generate script.');
            }
        } catch(e) {
            setError('Error generating script.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedScene, charactersInScene, tone, allScenes, updateVoiceScript, setIsDirty]);

    return (
        <div className="space-y-8">
             <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">Generate Voice Scripts</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Create dialogue for your characters scene by scene.</p>
                 {!outline ? (
                    <p className="text-amber-500 bg-amber-500/10 p-3 rounded-lg">Please create an outline first.</p>
                ) : (
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="vs-scene-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Select Scene</label>
                                <select id="vs-scene-select" value={selectedScene} onChange={e => setSelectedScene(Number(e.target.value))} className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg">
                                    {allScenes.map(s => <option key={s.scene} value={s.scene}>Scene {s.scene}: {s.description.substring(0, 50)}...</option>)}
                                </select>
                            </div>
                             <CustomSelect id="script-tone" label="Script Tone" options={SCRIPT_TONE_OPTIONS} value={tone} onChange={setTone} />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Characters in Scene</label>
                            <input type="text" value={charactersInScene} onChange={e => setCharactersInScene(e.target.value)} placeholder={`e.g., ${characters.map(c => c.name).join(', ')}`} className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                         </div>
                         <button onClick={handleGenerate} disabled={isLoading || !charactersInScene} className="px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">
                             {isLoading ? <Spinner /> : 'Generate Script'}
                        </button>
                    </div>
                )}
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
             {voiceScripts.length > 0 && (
                <div className="space-y-6">
                    {voiceScripts.map(script => (
                         <div key={script.scene} className="bg-white dark:bg-slate-800 rounded-xl p-6 border">
                            <h4 className="font-bold text-lg text-fuchsia-600">Scene {script.scene} - {script.tone}</h4>
                            <div className="mt-4 space-y-3 prose prose-slate dark:prose-invert max-w-none">
                                {script.script.map((line, i) => (
                                    <p key={i}><strong>{line.character}:</strong> {line.line}</p>
                                ))}
                            </div>
                         </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Main Studio2D Component ---

type Submodule = 'outline' | 'plot' | 'locations' | 'storyboard' | 'voice';

const Studio2D: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Submodule>('outline');

    const tabs: { id: Submodule; label: string; icon: React.ReactElement<{ className?: string }> }[] = [
        { id: 'outline', label: 'Outline', icon: <ICONS.FileTextIcon className="h-5 w-5" /> },
        { id: 'plot', label: 'Plot Engine', icon: <ICONS.BookOpenIcon className="h-5 w-5" /> },
        { id: 'locations', label: 'Locations', icon: <ICONS.MapIcon className="h-5 w-5" /> },
        { id: 'storyboard', label: 'Storyboard', icon: <ICONS.ClapperboardIcon className="h-5 w-5" /> },
        { id: 'voice', label: 'Voice Scripts', icon: <ICONS.MicIcon className="h-5 w-5" /> },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'outline': return <OutlineCreator />;
            case 'plot': return <PlotEngine />;
            case 'locations': return <LocationCreator />;
            case 'storyboard': return <StoryboardCreator />;
            case 'voice': return <VoiceScriptWriter />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-6">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
                                        ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                                } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {React.cloneElement(tab.icon, { className: 'mr-2 h-5 w-5' })}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            
            <div>
                {renderContent()}
            </div>
        </div>
    );
};


export default Studio2D;