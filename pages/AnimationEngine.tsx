import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ICONS } from '../constants';

const AnimationEngine: React.FC = () => {
    const { storyboard, voiceScripts } = useContext(AppContext);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const timeoutRef = useRef<number | null>(null);

    // Populate voice list from browser
    useEffect(() => {
        const populateVoiceList = () => {
          const availableVoices = window.speechSynthesis.getVoices();
          if (availableVoices.length > 0) {
            setVoices(availableVoices);
            if (!selectedVoiceURI) {
                const defaultVoice = availableVoices.find(voice => voice.lang.includes('en-US')) || availableVoices.find(voice => voice.lang.includes('en')) || availableVoices[0];
                if (defaultVoice) setSelectedVoiceURI(defaultVoice.voiceURI);
            }
          }
        };
        populateVoiceList();
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
        return () => { 
            window.speechSynthesis.cancel(); 
            window.speechSynthesis.onvoiceschanged = null;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
      }, []);

    const playPanel = useCallback((panelIndex: number) => {
        if (panelIndex >= storyboard.length) {
            setIsPlaying(false);
            setCurrentPanelIndex(0);
            return;
        }

        setCurrentPanelIndex(panelIndex);
        const currentPanel = storyboard[panelIndex];
        // Find all script lines for the scene
        const scriptForScene = voiceScripts.find(vs => vs.scene === currentPanel.scene);
        
        const textToSpeak = scriptForScene 
            ? scriptForScene.script.map(line => `${line.character}. ${line.line}`).join('. ')
            : (currentPanel.soundEffect ? `Sound of ${currentPanel.soundEffect}.` : `Scene is: ${currentPanel.description}`);

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = utterance;
        const selectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.onend = () => {
            timeoutRef.current = window.setTimeout(() => {
                playPanel(panelIndex + 1);
            }, 1500); // 1.5 second pause between panels
        };
        
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted') {
                console.error('Speech synthesis error:', e);
            }
            // Even if speech fails, try to continue
            timeoutRef.current = window.setTimeout(() => {
                playPanel(panelIndex + 1);
            }, 1500);
        };
        
        window.speechSynthesis.speak(utterance);
    }, [storyboard, voiceScripts, selectedVoiceURI, voices]);

    const handlePlayPause = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel(); 
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            playPanel(currentPanelIndex);
        }
    };
    
    // Reset if project data changes
    useEffect(() => {
        setCurrentPanelIndex(0);
        setIsPlaying(false);
        window.speechSynthesis.cancel();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, [storyboard, voiceScripts]);


    const canPlay = storyboard.length > 0 && voiceScripts.length > 0;
    const currentPanel = storyboard.length > 0 ? storyboard[currentPanelIndex] : null;

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-md">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Animation Preview</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Combine your storyboard and voice scripts into a playable animatic.</p>
                {!canPlay ? (
                    <p className="text-amber-500 dark:text-amber-400 bg-amber-500/10 p-3 rounded-lg">
                        Please create at least one storyboard panel and one voice script to use the Animation Engine.
                    </p>
                ) : (
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <label htmlFor="voice-select" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Playback Voice</label>
                                <select id="voice-select" value={selectedVoiceURI} disabled={isPlaying} onChange={(e) => setSelectedVoiceURI(e.target.value)} className="w-full max-w-md p-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 shadow-sm disabled:opacity-50">
                                    {voices.map(voice => (<option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>))}
                                </select>
                            </div>
                            <button
                                onClick={handlePlayPause}
                                className="px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg shadow-fuchsia-500/30 hover:bg-fuchsia-700 disabled:bg-fuchsia-400/80 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex items-center justify-center transform hover:scale-105"
                            >
                                {isPlaying ? <ICONS.StopCircleIcon className="h-6 w-6 mr-2" /> : <ICONS.PlayIcon className="h-6 w-6 mr-2" />}
                                {isPlaying ? 'Stop Animatic' : 'Play Animatic'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {currentPanel && (
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 animate-fade-in-up shadow-lg flex flex-col items-center">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                        Scene {currentPanel.scene} ({currentPanelIndex + 1} / {storyboard.length})
                    </h4>
                    <div className="w-full max-w-2xl aspect-video bg-slate-900/20 dark:bg-slate-900/50 rounded-lg overflow-hidden mb-4 shadow-inner flex items-center justify-center">
                         <img src={currentPanel.imageUrl} alt={`Scene ${currentPanel.scene}`} className="w-full h-full object-contain transition-all duration-500 ease-in-out" key={currentPanel.imageUrl} />
                    </div>
                    <div className="w-full max-w-2xl text-center">
                        <p className="text-slate-600 dark:text-slate-300 italic">"{currentPanel.description}"</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnimationEngine;
