import React from 'react';

export type NavItemType = 
  | 'dashboard' 
  | 'cloudAssetHub'
  | 'studio2D'
  | 'studio3D'
  | 'characterEngine'
  | 'generativeVideo'
  | 'vfxCompositing'
  | 'animationEngine'
  | 'distributionAnalytics';

export interface NavItem {
  id: NavItemType;
  label: string;
  icon: React.ReactElement<{ className?: string }>;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  backstory: string;
  personality: string;
}

export interface RiggedCharacter {
  characterName: string;
  spriteSheetUrl: string;
  animationType: string;
  frameCount: number;
}

export interface Location {
    name: string;
    description: string;
    imageUrl: string;
}

export interface StoryboardPanel {
  scene: number;
  description: string;
  shotType: string;
  imageUrl: string;
  cameraMovement: string;
  soundEffect: string;
}

export interface Outline {
  title: string;
  logline: string;
  acts: {
    act: number;
    title: string;
    summary: string;
    scenes: {
        scene: number;
        description: string;
    }[];
  }[];
}

export interface Plot {
  title: string;
  template: string;
  summary: string;
  acts: {
    act: number;
    title: string;
    summary: string;
    plotPoints: string[];
  }[];
  twist?: string;
  resolution?: string;
}

export interface MarketingResult {
  taglines: string[];
  socialMediaPost: string;
  shortSynopsis: string;
  engagementHooks: string[];
}

export interface VoiceScript {
  scene: number;
  character: string;
  tone: string;
  script: {
    character: string;
    line: string;
  }[];
}


// Global App Context
export type Theme = 'light' | 'dark';

export interface AppState {
    theme: Theme;
    activeView: NavItemType;
    outline: Outline | null;
    plot: Plot | null;
    characters: Character[];
    riggedCharacters: RiggedCharacter[];
    locations: Location[];
    storyboard: StoryboardPanel[];
    marketingKit: MarketingResult | null;
    voiceScripts: VoiceScript[];
    mainAction: (() => void) | null;
    isDirty: boolean;
    initialRiggingTarget: string | null; // Character ID
}

export interface AppContextType extends AppState {
    toggleTheme: () => void;
    setActiveView: (view: NavItemType) => void;
    setOutline: (outline: Outline | null) => void;
    setPlot: (plot: Plot | null) => void;
    addCharacter: (character: Character) => void;
    updateCharacter: (character: Character) => void;
    deleteCharacter: (characterId: string) => void;
    addRiggedCharacter: (rig: RiggedCharacter) => void;
    addLocation: (location: Location) => void;
    addStoryboardPanel: (panel: StoryboardPanel) => void;
    setMarketingKit: (kit: MarketingResult | null) => void;
    updateVoiceScript: (script: VoiceScript) => void;
    registerMainAction: (action: (() => void) | null) => void;
    getState: () => AppState;
    resetProject: () => void;
    setIsDirty: (isDirty: boolean) => void;
    navigateToRigging: (characterId: string) => void;
}