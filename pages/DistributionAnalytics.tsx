import React, { useState, useContext, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { generateMarketingCopy } from '../services/geminiService';
import { Spinner, SpeechRecognitionButton, CustomSelect } from '../components';
import { AppContext } from '../contexts/AppContext';
import { ICONS, AUDIENCE_OPTIONS, PLATFORM_OPTIONS } from '../constants';

const DistributionAnalytics: React.FC = () => {
  const { outline, marketingKit, setMarketingKit, registerMainAction, setIsDirty } = useContext(AppContext);
  const [title, setTitle] = useState('');
  const [logline, setLogline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetAudience, setTargetAudience] = useState(AUDIENCE_OPTIONS[2]);
  const [platform, setPlatform] = useState(PLATFORM_OPTIONS[0]);
  
  useEffect(() => {
    if(outline) {
        setTitle(outline.title);
        setLogline(outline.logline);
    }
  }, [outline]);
  
  useEffect(() => {
    const hasUnsavedChanges = (title.trim() !== '' || logline.trim() !== '') && !marketingKit;
    setIsDirty(hasUnsavedChanges);
  }, [title, logline, marketingKit, setIsDirty]);

  const handleGenerate = useCallback(async () => {
    if (!title || !logline || !targetAudience || !platform) {
      setError('Please provide all campaign configuration details.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMarketingKit(null);
    try {
      const response = await generateMarketingCopy(title, logline, targetAudience, platform);
      if (response) {
        setMarketingKit(response);
      } else {
        setError('Failed to generate marketing copy. The AI returned an invalid format.');
      }
    } catch (e) {
      setError('An error occurred while communicating with the AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [title, logline, targetAudience, platform, setMarketingKit]);

  useEffect(() => {
    registerMainAction(handleGenerate);
    return () => registerMainAction(null);
  }, [handleGenerate, registerMainAction]);

  const handleDownloadKit = async () => {
    if (!marketingKit) return;
    const zip = new JSZip();
    zip.file("taglines.txt", marketingKit.taglines.join("\n"));
    zip.file("social_media_post.txt", marketingKit.socialMediaPost);
    zip.file("synopsis.txt", marketingKit.shortSynopsis);
    zip.file("engagement_hooks.txt", marketingKit.engagementHooks.join("\n"));

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Distribution-Kit-${platform.replace(/\s/g, '_')}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="bg-white dark:bg-slate-800/80 p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-1">1. Configure Distribution Campaign</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Provide project details to generate a tailored distribution kit.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Project Title</label>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Last Flower (from Outline)"
                className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Project Logline</label>
            <textarea
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="e.g., A lonely robot in a post-apocalyptic world finds a single living flower..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                rows={2}
            />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomSelect
                    id="audience"
                    label="Target Audience"
                    options={AUDIENCE_OPTIONS}
                    value={targetAudience}
                    onChange={setTargetAudience}
                />
                <CustomSelect
                    id="platform"
                    label="Target Platform"
                    options={PLATFORM_OPTIONS}
                    value={platform}
                    onChange={setPlatform}
                />
            </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading || !title || !logline}
          className="mt-6 px-8 py-3 bg-fuchsia-600 text-white font-semibold rounded-lg shadow-lg hover:bg-fuchsia-700 disabled:bg-slate-400"
        >
          {isLoading ? <Spinner /> : 'Generate Distribution Kit'}
        </button>
      </div>

      {error && <div className="text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>}

      {marketingKit && (
        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-8 animate-fade-in-up space-y-6 shadow-md rounded-xl">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Distribution Kit for <span className="text-fuchsia-600">{platform}</span></h3>
                <button onClick={handleDownloadKit} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-900/50 rounded-lg">
                    <ICONS.DownloadIcon className="h-4 w-4"/> Download Kit
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border">
                    <h4 className="font-bold text-fuchsia-600 mb-3">Taglines</h4>
                    <ul className="list-disc list-inside space-y-2">{marketingKit.taglines.map((tagline, index) => <li key={index}>{tagline}</li>)}</ul>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border">
                    <h4 className="font-bold text-fuchsia-600 mb-3">Engagement Hooks</h4>
                    <ul className="list-disc list-inside space-y-2">{marketingKit.engagementHooks.map((hook, index) => <li key={index} className="italic">"{hook}"</li>)}</ul>
                </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border">
                <h4 className="font-bold text-fuchsia-600 mb-3">Short Synopsis</h4>
                <p className="prose prose-slate dark:prose-invert max-w-none">{marketingKit.shortSynopsis}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border">
                <h4 className="font-bold text-fuchsia-600 mb-3">Social Media Post for {platform}</h4>
                <div className="bg-white dark:bg-slate-900/70 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                    <p className="whitespace-pre-wrap font-sans">{marketingKit.socialMediaPost}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DistributionAnalytics;
