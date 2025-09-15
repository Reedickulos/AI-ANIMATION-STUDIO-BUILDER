import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Character, RiggedCharacter } from '../types';
import { generateImage, generateCharacterProfile, generateSpriteSheet, fileToGenerativePart } from '../services/geminiService';
import { Spinner, SpeechRecognitionButton } from '../components';
import { ICONS } from '../constants';


// --- Submodule: Character Creator ---

const EditCharacterModal: React.FC<{
    character: Character;
    isOpen: boolean;
    onClose: () => void;
    onSave: (character: Character) => void;
}> = ({ character, isOpen, onClose, onSave }) => {
    const [editedCharacter, setEditedCharacter] = useState<Character>(character);

    useEffect(() => {
        setEditedCharacter(character);
    }, [character]);

    if (!isOpen) return null;

    const handleFieldChange = (field: keyof Omit<Character, 'id' | 'imageUrl'>, value: string) => {
        setEditedCharacter(prev => ({ ...prev, [field]: value }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imagePart = await fileToGenerativePart(file);
            const dataUrl = `data:${imagePart.mimeType};base64,${imagePart.data}`;
            setEditedCharacter(prev => ({ ...prev, imageUrl: dataUrl }));
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-down" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Character: {character.name}</h3>
                </div>
                <div className="p-6 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Character Image</label>
                             <img src={editedCharacter.imageUrl} alt={editedCharacter.name} className="w-full h-auto object-cover rounded-lg shadow-md mb-2" />
                             <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100" />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Name</label>
                                <input type="text" value={editedCharacter.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Personality</label>
                                <textarea value={editedCharacter.personality} onChange={e => handleFieldChange('personality', e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg" rows={4}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Backstory</label>
                                <textarea value={editedCharacter.backstory} onChange={e => handleFieldChange('backstory', e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg" rows={4}/>
                            </div>
                        </div>
                     </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Cancel</button>
                    <button onClick={() => onSave(editedCharacter)} className="px-6 py-2 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-md hover:bg-fuchsia-700 transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const CharacterCreator: React.FC<{ onCharacterCreated: (characterId: string) => void }> = ({ onCharacterCreated }) => {
    const { characters, addCharacter, updateCharacter, deleteCharacter, setIsDirty } = useContext(AppContext);
    
    const [prompt, setPrompt] = useState('');
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewCharacter, setPreviewCharacter] = useState<Omit<Character, 'id'> | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

    useEffect(() => {
        const hasUnsavedChanges = !previewCharacter && (prompt.trim() !== '' || !!uploadedImage);
        setIsDirty(hasUnsavedChanges);
    }, [prompt, uploadedImage, previewCharacter, setIsDirty]);

    const resetForm = useCallback(() => {
        setPrompt('');
        setUploadedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setError(null);
    }, [previewUrl]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setUploadedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt && !uploadedImage) {
            setError('Please enter a character description or upload an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setPreviewCharacter(null);
        try {
            const imagePart = uploadedImage ? await fileToGenerativePart(uploadedImage) : null;
            const profilePromise = generateCharacterProfile(prompt, imagePart);
            
            let imageUrlPromise: Promise<string | null>;
            if (imagePart) {
                imageUrlPromise = Promise.resolve(`data:${imagePart.mimeType};base64,${imagePart.data}`);
            } else {
                imageUrlPromise = generateImage(`Character sheet, full body portrait of: ${prompt}. cinematic lighting, high detail, concept art style, neutral background.`);
            }

            const [profileData, imageUrl] = await Promise.all([profilePromise, imageUrlPromise]);

            if (imageUrl && profileData) {
                const generatedCharacter: Omit<Character, 'id'> = {
                    name: profileData.name,
                    description: prompt,
                    imageUrl: imageUrl,
                    personality: profileData.personality,
                    backstory: profileData.backstory,
                };
                setPreviewCharacter(generatedCharacter);
                setIsDirty(true); // Now we have a preview, which is unsaved
            } else {
                setError('Failed to generate complete character profile.');
            }
        } catch (e) {
            setError('An error occurred while communicating with the AI.');
        } finally {
            setIsLoading(false);
        }
    }, [prompt, uploadedImage, setIsDirty]);

    const handleSaveCharacter = () => {
        if(previewCharacter) {
            const newId = Date.now().toString();
            addCharacter({ ...previewCharacter, id: newId });
            setPreviewCharacter(null);
            resetForm();
            setIsDirty(false);
            onCharacterCreated(newId);
        }
    };
    
    if (isLoading) {
        return <div className="flex flex-col items-center justify-center h-full p-8 text-center"><Spinner /><p className="mt-4 text-lg">Generating Character...</p></div>
    }

    if (previewCharacter) {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                     <h3 className="text-xl font-bold mb-4">Edit & Save Your Character</h3>
                     {/* Edit form for previewCharacter */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <img src={previewCharacter.imageUrl} alt={previewCharacter.name} className="w-full h-auto object-cover rounded-lg shadow-lg" />
                        </div>
                        <div className="lg:col-span-2 space-y-4">
                           {/* Inputs for name, personality, backstory */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Name</label>
                                <input type="text" value={previewCharacter.name} onChange={e => setPreviewCharacter(p => p ? {...p, name: e.target.value} : null)} className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Personality</label>
                                <textarea value={previewCharacter.personality} onChange={e => setPreviewCharacter(p => p ? {...p, personality: e.target.value} : null)} className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white" rows={4}/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Backstory</label>
                                <textarea value={previewCharacter.backstory} onChange={e => setPreviewCharacter(p => p ? {...p, backstory: e.target.value} : null)} className="w-full p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white" rows={4}/>
                            </div>
                        </div>
                     </div>
                     <div className="mt-6 flex items-center gap-4">
                        <button onClick={handleSaveCharacter} className="px-6 py-2 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-md hover:bg-fuchsia-700">Save Character</button>
                        <button onClick={() => setPreviewCharacter(null)} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300">Discard & Edit Prompt</button>
                     </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {editingCharacter && <EditCharacterModal isOpen={isEditModalOpen} character={editingCharacter} onClose={() => setIsEditModalOpen(false)} onSave={updateCharacter}/>}
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">1. Describe Your Character</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Provide a description, upload a reference image, or both.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Description and Image Upload inputs */}
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Description (or dictate)</label>
                        <div className="relative">
                           <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A grizzled space pirate with a cybernetic eye..." className="w-full p-3 pr-12 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg" rows={5}/>
                            <div className="absolute top-2 right-2"><SpeechRecognitionButton onTranscriptUpdate={(t) => setPrompt(p => p + t)} /></div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Reference Image (Optional)</label>
                        <label htmlFor="image-upload" className="cursor-pointer group">
                           <div className="relative w-full h-full min-h-[142px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center text-center p-4 hover:border-fuchsia-500">
                                {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-32 rounded-md object-contain" /> : <ICONS.UploadCloudIcon className="h-10 w-10 text-slate-400 group-hover:text-fuchsia-500" />}
                            </div>
                        </label>
                        <input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isLoading || (!prompt && !uploadedImage)} className="mt-6 px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">Generate Character Sheet</button>
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
            {characters.length > 0 && <h3 className="text-2xl font-bold mt-12">Project Characters</h3>}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {characters.map((character) => (
                    <div key={character.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                         <div className="relative w-full h-80 bg-slate-200 dark:bg-slate-700">
                           <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                           <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setEditingCharacter(character); setIsEditModalOpen(true);}} className="p-2 rounded-full bg-slate-800/60 text-white hover:bg-slate-900/80"><ICONS.EditIcon className="h-5 w-5"/></button>
                               <button onClick={() => deleteCharacter(character.id)} className="p-2 rounded-full bg-red-600/70 text-white hover:bg-red-700/90"><ICONS.TrashIcon className="h-5 w-5"/></button>
                           </div>
                         </div>
                        <div className="p-5">
                            <h4 className="text-2xl font-bold">{character.name}</h4>
                            <p className="text-slate-500 text-sm mb-4 italic">"{character.description}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Submodule: Character Rigging ---

const SpriteAnimation: React.FC<{ rig: RiggedCharacter }> = ({ rig }) => {
    const { spriteSheetUrl, frameCount, characterName, animationType } = rig;
    const animationClassName = `sprite-viewer-${characterName.replace(/\s+/g, '-')}-${animationType.replace(/\s+/g, '-')}`;
    const frameWidth = 128;
    const frameHeight = 128;
    const style = `.${animationClassName} { width: ${frameWidth}px; height: ${frameHeight}px; background-image: url(${spriteSheetUrl}); animation: play-${animationClassName} 1s steps(${frameCount}) infinite; transform: scale(1.5); image-rendering: pixelated; } @keyframes play-${animationClassName} { from { background-position: 0px 0; } to { background-position: -${frameWidth * frameCount}px 0; } }`;
    return <><style>{style}</style><div className={animationClassName}></div></>;
};

const CharacterRigging: React.FC<{ initialCharacterId?: string | null, onRiggingComplete: () => void }> = ({ initialCharacterId, onRiggingComplete }) => {
    const { characters, riggedCharacters, addRiggedCharacter } = useContext(AppContext);
    
    const [selectedCharId, setSelectedCharId] = useState<string>('');
    const [selectedAnimType, setSelectedAnimType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialCharacterId) {
            setSelectedCharId(initialCharacterId);
        } else if (characters.length > 0 && !selectedCharId) {
            setSelectedCharId(characters[0].id);
        }
    }, [characters, initialCharacterId, selectedCharId]);
    
    const handleGenerate = async () => {
        const character = characters.find(c => c.id === selectedCharId);
        if (!character || !selectedAnimType) {
            setError('Please select a character and an animation type.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const { frames } = { 'Idle': { frames: 4 }, 'Walk Cycle': { frames: 8 }, 'Run Cycle': { frames: 8 }, 'Jump': { frames: 6 } }[selectedAnimType];
            const spriteSheetUrl = await generateSpriteSheet(character, selectedAnimType, frames);
            if (spriteSheetUrl) {
                addRiggedCharacter({ characterName: character.name, spriteSheetUrl, animationType: selectedAnimType, frameCount: frames });
                onRiggingComplete();
            } else {
                setError('Failed to generate sprite sheet.');
            }
        } catch (e) {
            setError('An error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    };

    const displayedRigs = riggedCharacters.filter(r => characters.find(c => c.id === selectedCharId)?.name === r.characterName);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold mb-1">1. Configure Sprite Sheet</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Select a character and animation to generate a 2D sprite sheet.</p>
                {characters.length === 0 ? (
                    <p className="text-amber-500 bg-amber-500/10 p-3 rounded-lg">Please create a character first.</p>
                ) : (
                    <div className="space-y-4">
                        {/* Character and Animation selection UI */}
                        <div>
                            <label htmlFor="char-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Select Character</label>
                            <select id="char-select" value={selectedCharId} onChange={e => setSelectedCharId(e.target.value)} className="w-full max-w-md p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg">
                                {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Select Animation Type</label>
                             <div className="flex flex-wrap gap-3">
                                {['Idle', 'Walk Cycle', 'Run Cycle', 'Jump'].map(anim => (
                                    <button key={anim} onClick={() => setSelectedAnimType(anim)} className={`px-4 py-2 rounded-lg font-medium text-sm border-2 ${selectedAnimType === anim ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-transparent border-slate-300 dark:border-slate-600'}`}>
                                        {anim}
                                    </button>
                                ))}
                             </div>
                        </div>
                        <button onClick={handleGenerate} disabled={isLoading || !selectedCharId || !selectedAnimType} className="mt-6 px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400">
                            {isLoading ? <Spinner /> : 'Generate Sprite Sheet'}
                        </button>
                    </div>
                )}
            </div>
            {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}
            {displayedRigs.length > 0 && <h3 className="text-2xl font-bold mt-12">Generated Rigs for {characters.find(c=>c.id === selectedCharId)?.name}</h3>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedRigs.map((rig, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                        <h4 className="text-lg font-bold text-fuchsia-600 mb-4">{rig.animationType}</h4>
                        <div className="mb-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg h-[200px] w-full flex items-center justify-center">
                            <SpriteAnimation rig={rig} />
                        </div>
                        <a href={rig.spriteSheetUrl} download={`${rig.characterName}-${rig.animationType}.png`} className="flex items-center gap-2 w-full justify-center px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 rounded-lg">
                            <ICONS.DownloadIcon className="h-4 w-4" /> Download PNG
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main Character Engine Component ---

type Submodule = 'creator' | 'rigging';

const CharacterEngine: React.FC = () => {
    const { navigateToRigging, initialRiggingTarget } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<Submodule>('creator');
    const [showSuccessDialog, setShowSuccessDialog] = useState<string | null>(null); // Holds new character ID

    useEffect(() => {
        if (initialRiggingTarget) {
            setActiveTab('rigging');
        }
    }, [initialRiggingTarget]);

    const handleCharacterCreated = (characterId: string) => {
        setShowSuccessDialog(characterId);
    };

    const handleRigThisCharacter = () => {
        if (showSuccessDialog) {
            navigateToRigging(showSuccessDialog);
            setShowSuccessDialog(null);
        }
    };
    
    const handleCreateAnother = () => {
        setShowSuccessDialog(null);
        setActiveTab('creator');
    };

    const tabs: { id: Submodule; label: string; icon: React.ReactElement<{ className?: string }> }[] = [
        { id: 'creator', label: 'Character Creator', icon: <ICONS.UsersIcon className="h-5 w-5" /> },
        { id: 'rigging', label: 'Character Rigging', icon: <ICONS.BoneIcon className="h-5 w-5" /> },
    ];

    return (
        <div className="animate-fade-in-up">
             {showSuccessDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCreateAnother}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
                        <div className="mx-auto bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 h-16 w-16 flex items-center justify-center rounded-full mb-4">
                           <ICONS.SparklesIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Character Saved!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">What would you like to do next?</p>
                        <div className="flex justify-center gap-4">
                           <button onClick={handleRigThisCharacter} className="px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700">Rig This Character</button>
                           <button onClick={handleCreateAnother} className="px-6 py-3 bg-slate-200 dark:bg-slate-700 font-semibold rounded-lg hover:bg-slate-300">Create Another</button>
                        </div>
                    </div>
                </div>
             )}
            <div className="mb-6">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`${activeTab === tab.id ? 'border-fuchsia-500 text-fuchsia-600' : 'border-transparent text-slate-500 hover:text-slate-700'} group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm`}>
                                {React.cloneElement(tab.icon, { className: 'mr-2 h-5 w-5' })}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            
            {activeTab === 'creator' && <CharacterCreator onCharacterCreated={handleCharacterCreated} />}
            {activeTab === 'rigging' && <CharacterRigging initialCharacterId={initialRiggingTarget} onRiggingComplete={() => setActiveTab('rigging')} />}
        </div>
    );
};

export default CharacterEngine;