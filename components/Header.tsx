import React, { useContext } from 'react';
import JSZip from 'jszip';
import { AppContext } from '../contexts/AppContext';
import { ICONS } from '../constants';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { theme, toggleTheme, getState } = useContext(AppContext);

  const handleExport = async () => {
    const state = getState();
    const zip = new JSZip();

    let markdownSummary = `# AnimAI Studio Project: ${state.outline?.title || 'Untitled'}\n\n`;

    if (state.outline) {
      zip.file("outline.json", JSON.stringify(state.outline, null, 2));
      markdownSummary += `## Logline\n${state.outline.logline}\n\n`;
    }
    if (state.plot) {
      zip.file("plot.json", JSON.stringify(state.plot, null, 2));
    }
    if (state.characters.length > 0) {
      zip.file("characters.json", JSON.stringify(state.characters, null, 2));
       markdownSummary += `## Characters\n${state.characters.map(c => `- ${c.name}`).join('\n')}\n\n`;
    }
    if (state.locations.length > 0) {
      zip.file("locations.json", JSON.stringify(state.locations, null, 2));
    }
    if (state.storyboard.length > 0) {
      zip.file("storyboard.json", JSON.stringify(state.storyboard, null, 2));
    }
    if (state.voiceScripts.length > 0) {
      zip.file("voice-scripts.json", JSON.stringify(state.voiceScripts, null, 2));
    }
     if (state.marketingKit) {
      const marketingFolder = zip.folder('marketing');
      marketingFolder?.file("kit.json", JSON.stringify(state.marketingKit, null, 2));
      marketingFolder?.file("post.txt", state.marketingKit.socialMediaPost);
    }

    zip.file("summary.md", markdownSummary);

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `AnimAI-Project-${state.outline?.title.replace(/\s+/g, '-') || 'Export'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };


  return (
    <header className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 flex justify-between items-center transition-colors duration-300 animate-fade-in-down">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      <div className="flex items-center gap-4">
        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm hover:shadow-md"
            aria-label="Export Project"
        >
            <ICONS.DownloadIcon className="h-5 w-5" />
            <span>Export Project</span>
        </button>
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <ICONS.SunIcon className="h-5 w-5" /> : <ICONS.MoonIcon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;