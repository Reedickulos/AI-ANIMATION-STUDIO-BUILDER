import React from 'react';
import { ICONS } from '../constants';

const GenerativeVideo: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in-up">
            <div className="bg-fuchsia-100 dark:bg-slate-700 text-fuchsia-500 dark:text-fuchsia-400 p-4 rounded-full mb-6">
                <ICONS.SparklesIcon className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Generative Video Module</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md">
                This module is currently under construction. Soon, you'll be able to generate video from text, images, or other videos using tools like RunwayML, Kaiber, and Pika right here.
            </p>
        </div>
    );
};

export default GenerativeVideo;
