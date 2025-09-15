import { GoogleGenAI } from "@google/genai";
import { Outline, Plot, VoiceScript, Character } from "../types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonFromMarkdown = <T,>(text: string): T | null => {
    try {
        let jsonStr = text.trim();
        const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[1]) {
            jsonStr = match[1].trim();
        }
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Failed to parse JSON response:", e);
        console.error("Original text:", text);
        return null;
    }
};

export const fileToGenerativePart = async (file: File): Promise<{ mimeType: string; data: string }> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        mimeType: file.type,
        data: await base64EncodedDataPromise,
    };
};

/**
 * Fetches an image from a URL and converts it to a GoogleGenerativeAI.Part object.
 * This is necessary for sending image data to the Gemini model.
 */
export const imageUrlToGenerativePart = async (url: string, mimeType: string = 'image/jpeg'): Promise<{mimeType: string, data: string}> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    return {
        mimeType: blob.type || mimeType,
        data,
    };
};


export const generateOutline = async (prompt: string, genre: string, tone: string, targetAudience: string): Promise<Outline | null> => {
    const fullPrompt = `Based on the following idea, create a detailed story outline for an animated short film.
    - Genre: ${genre}
    - Tone: ${tone}
    - Target Audience: ${targetAudience}
    - Core Idea: "${prompt}"
    The output must be a single JSON object with the following structure: {title: string, logline: string, acts: [{act: number, title: string, summary: string, scenes: [{scene: number, description: string}]}]}. Do not include any explanatory text outside of the JSON object.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
        },
    });
    return parseJsonFromMarkdown<Outline>(response.text);
};

export const generatePlot = async (title: string, logline: string, template: string): Promise<Plot | null> => {
    const fullPrompt = `Generate a detailed plot for a story titled "${title}" with logline "${logline}".
    Use the "${template}" plot structure.
    The output must be a single JSON object with the structure: {title: string, template: string, summary: string, acts: [{act: number, title: string, summary: string, plotPoints: string[]}], twist: string, resolution: string}.
    Ensure the plot points are detailed and follow the conventions of the chosen template.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
        },
    });
    return parseJsonFromMarkdown<Plot>(response.text);
}

export const generateCharacterProfile = async (description: string, image: {mimeType: string, data: string} | null): Promise<{name: string, personality: string, backstory: string} | null> => {
    const textPrompt = image 
        ? `Analyze the attached image of a character. Based on their appearance, create a detailed character profile. The user has provided additional context: "${description}". Use this context to inform the personality and backstory, but the visual identity from the image is the primary source. Provide a response as a single JSON object with three keys: "name" (a fitting name for the character), "personality" (a short paragraph describing their key traits), and "backstory" (a concise background summary).`
        : `Generate a detailed character profile based on this description: "${description}". Provide a response as a single JSON object with three keys: "name" (a fitting name for the character), "personality" (a short paragraph describing their key traits), and "backstory" (a concise background summary).`;
    
    const textPart = { text: textPrompt };
    const parts: any[] = [textPart];
    if (image) {
        parts.push({ inlineData: image });
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: { parts: parts },
        config: {
            responseMimeType: "application/json",
        },
    });
    return parseJsonFromMarkdown<{name: string, personality: string, backstory: string}>(response.text);
};

export const generatePromptForLocation = async (prompt: string, image: {mimeType: string, data: string}): Promise<string | null> => {
    const textPrompt = `You are an expert prompt engineer for an AI image generation model. A user has provided a basic prompt and a reference image. Your task is to combine them into a new, single, highly-detailed text prompt for generating a new image.
- User's prompt: "${prompt}"
- Reference image is attached.
Analyze the style, color palette, mood, and key elements of the reference image. Combine these visual details with the user's prompt to create a rich, descriptive prompt. The output MUST be only the new prompt text, nothing else.`;

    const textPart = { text: textPrompt };
    const imagePart = { inlineData: image };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: { parts: [textPart, imagePart] }
    });
    
    return response.text.trim();
};


export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

export const generateSpriteSheet = async (character: Character, animationType: string, frameCount: number): Promise<string | null> => {
    // Step 1: Analyze the character's image to get a detailed description for visual consistency.
    const visionPrompt = "You are an expert character artist. Analyze the attached image of a character. Describe their appearance, clothing, art style, and key features in a detailed paragraph. This description will be used to create a new animation, so be precise to ensure visual consistency.";
    const imagePart = await imageUrlToGenerativePart(character.imageUrl);
    
    const visionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: { parts: [{ text: visionPrompt }, { inlineData: imagePart }] }
    });
    const detailedDescription = visionResponse.text;

    // Step 2: Use the detailed description to generate the sprite sheet.
    const imageGenPrompt = `A 2D animation sprite sheet of a character.
**Detailed character description:** "${detailedDescription}".
The sprite sheet must show a '${animationType}' animation.
It should contain exactly ${frameCount} frames of animation, arranged horizontally in a single row.
The background MUST be transparent.
The art style and character design must remain consistent with the detailed description across all frames.
Each frame should be clearly distinct to form a smooth animation sequence.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: imageGenPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png' // PNG for transparency
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating sprite sheet:", error);
        return null;
    }
};

export const generateStoryboardPanelInfo = async (sceneDescription: string) => {
    const prompt = `For the scene "${sceneDescription}", provide a shot type, camera movement, and sound effect suggestion. Respond in a single JSON object format: {"shotType": "e.g., Medium Shot", "cameraMovement": "e.g., Pan Right", "soundEffect": "e.g., Footsteps on gravel"}.`;
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });
    return parseJsonFromMarkdown<{shotType: string; cameraMovement: string; soundEffect: string}>(response.text);
};

export const generateMarketingCopy = async (projectTitle: string, projectLogline: string, targetAudience: string, platform: string) => {
    const prompt = `Generate marketing materials for an animated project titled "${projectTitle}" with the logline: "${projectLogline}". 
    The campaign should target "${targetAudience}" on the "${platform}" platform.
    Adapt the tone of the social media post to be ideal for that specific platform (e.g., TikTok should be informal and trendy, Press Release should be formal).
    Provide a response in a single JSON object with four keys: 
    1. "taglines" (an array of 3 strings), 
    2. "socialMediaPost" (a short, engaging post tailored for the specified platform and audience), 
    3. "shortSynopsis" (a one-paragraph synopsis),
    4. "engagementHooks" (an array of 3 short, psychologically-driven questions or statements to drive comments and shares, like using curiosity, FOMO, or controversy).`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });
    return parseJsonFromMarkdown<{taglines: string[], socialMediaPost: string, shortSynopsis: string, engagementHooks: string[]}>(response.text);
};

export const generateVoiceoverScript = async (sceneDescription: string, characters: string, tone: string): Promise<VoiceScript | null> => {
    const prompt = `Generate a voiceover script for an animation scene.
- Scene Description: "${sceneDescription}"
- Characters in scene: ${characters}
- Desired Tone: ${tone}
Provide a response as a single JSON object with the format: {scene: number, character: string, tone: string, script: [{character: string, line: string}]}. 
The 'script' should be an array of dialogue objects. Assume scene number is 1 for this context. The primary speaking character should be noted in the 'character' field.`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });
    return parseJsonFromMarkdown<VoiceScript>(response.text);
};