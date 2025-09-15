import React, { createContext, useState, ReactNode, useRef, useCallback } from 'react';
import { AppContextType, AppState, Theme, NavItemType, Outline, Character, Location, StoryboardPanel, Plot, MarketingResult, VoiceScript, RiggedCharacter } from '../types';

export const AppContext = createContext<AppContextType>({} as AppContextType);

const defaultState: AppState = {
    theme: 'dark',
    activeView: 'dashboard',
    outline: null,
    plot: null,
    characters: [],
    locations: [],
    storyboard: [],
    marketingKit: null,
    voiceScripts: [],
    riggedCharacters: [],
    mainAction: null,
    isDirty: false,
    initialRiggingTarget: null,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(defaultState);
    const mainActionRef = useRef<(() => void) | null>(null);

    const toggleTheme = () => {
        setState(prevState => {
            const newTheme = prevState.theme === 'light' ? 'dark' : 'light';
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return { ...prevState, theme: newTheme };
        });
    };

    const setActiveView = (view: NavItemType) => {
        // When navigating, clear any single-use state like the rigging target
        setState(prevState => ({ ...prevState, activeView: view, initialRiggingTarget: null, isDirty: false }));
    };
    
    const setOutline = (outline: Outline | null) => setState(prevState => ({...prevState, outline}));
    const setPlot = (plot: Plot | null) => setState(prevState => ({...prevState, plot}));
    const addCharacter = (character: Character) => setState(prevState => ({ ...prevState, characters: [...prevState.characters, character] }));
    const updateCharacter = (updatedCharacter: Character) => {
        setState(prevState => ({
            ...prevState,
            characters: prevState.characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c)
        }));
    };
    const deleteCharacter = (characterId: string) => {
        setState(prevState => ({
            ...prevState,
            characters: prevState.characters.filter(c => c.id !== characterId)
        }));
    };
    const addRiggedCharacter = (rig: RiggedCharacter) => setState(prevState => ({ ...prevState, riggedCharacters: [...prevState.riggedCharacters, rig] }));
    const addLocation = (location: Location) => setState(prevState => ({ ...prevState, locations: [...prevState.locations, location] }));
    const addStoryboardPanel = (panel: StoryboardPanel) => setState(prevState => ({ ...prevState, storyboard: [...prevState.storyboard, panel] }));
    const setMarketingKit = (kit: MarketingResult | null) => setState(prevState => ({...prevState, marketingKit: kit}));
    
    const updateVoiceScript = (script: VoiceScript) => {
        setState(prevState => {
            const newScripts = [...prevState.voiceScripts];
            const index = newScripts.findIndex(s => s.scene === script.scene);
            if (index > -1) {
                newScripts[index] = script; // Replace existing script
            } else {
                newScripts.push(script); // Add new script
            }
            // Keep scripts sorted by scene number for consistency
            newScripts.sort((a, b) => a.scene - b.scene);
            return { ...prevState, voiceScripts: newScripts };
        });
    };


    const registerMainAction = useCallback((action: (() => void) | null) => {
        mainActionRef.current = action;
        // This is a trick to get App.tsx to re-render and update its event listener with the new action.
        setState(prevState => ({...prevState, mainAction: action}));
    }, []);

    const resetProject = () => {
        if(window.confirm('Are you sure you want to start a new project? All current progress will be lost.')) {
            setState(prevState => ({
                ...defaultState,
                theme: prevState.theme, // Keep the theme setting
            }));
            // Ensure the view is reset to dashboard
            setActiveView('dashboard');
        }
    };
    
    const getState = () => {
        // Return a snapshot of the current state for export
        return {...state, mainAction: undefined };
    };

    const setIsDirty = (isDirty: boolean) => {
        setState(prevState => {
            if (prevState.isDirty === isDirty) return prevState;
            return { ...prevState, isDirty };
        });
    };

    const navigateToRigging = (characterId: string) => {
        setState(prevState => ({
            ...prevState,
            activeView: 'characterEngine',
            initialRiggingTarget: characterId,
            isDirty: false
        }));
    };


    const contextValue: AppContextType = {
        ...state,
        toggleTheme,
        setActiveView,
        setOutline,
        setPlot,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        addRiggedCharacter,
        addLocation,
        addStoryboardPanel,
        setMarketingKit,
        updateVoiceScript,
        registerMainAction,
        getState,
        resetProject,
        setIsDirty,
        navigateToRigging,
    };
    
    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};