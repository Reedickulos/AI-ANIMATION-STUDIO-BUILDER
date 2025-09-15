import React from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { ICONS } from '../constants';

interface SpeechRecognitionButtonProps {
    onTranscriptUpdate: (transcript: string) => void;
}

const SpeechRecognitionButton: React.FC<SpeechRecognitionButtonProps> = ({ onTranscriptUpdate }) => {
    const { isListening, error, toggleListening } = useSpeechRecognition(onTranscriptUpdate);

    return (
        <button
            type="button"
            onClick={toggleListening}
            title={isListening ? 'Stop recording' : 'Start recording'}
            className={`p-2 rounded-full transition-colors duration-200 ${
                isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
            }`}
        >
            <ICONS.MicIcon className="h-5 w-5" />
            {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
        </button>
    );
};

export default SpeechRecognitionButton;
