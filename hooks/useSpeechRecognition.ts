import { useState, useEffect, useCallback, useRef } from 'react';

// A polyfill for browsers that only support webkitSpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const useSpeechRecognition = (onTranscriptUpdate: (transcript: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any | null>(null);
    const fullTranscriptRef = useRef<string>(''); // Used to store the full transcript of a recording session

    // Use a ref to hold the callback to avoid re-running the effect when it changes
    const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
    useEffect(() => {
        onTranscriptUpdateRef.current = onTranscriptUpdate;
    }, [onTranscriptUpdate]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [isListening]);
    
    const startListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition && !isListening) {
             try {
                // Reset transcript at the beginning of a new session
                fullTranscriptRef.current = '';
                recognition.start();
                setError(null);
            } catch(e) {
                console.error("Could not start recognition", e);
                if ((e as Error).name === 'not-allowed') {
                    setError("Mic access denied.");
                } else {
                    setError("Mic could not start.");
                }
            }
        }
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);


    useEffect(() => {
        if (!SpeechRecognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        // `continuous` means it won't stop after the user pauses.
        recognition.continuous = true;
        // `interimResults` provides real-time feedback to the engine, which can improve the final accuracy.
        // We will only commit the final transcript at the end.
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            // Reconstruct the full transcript from all results received so far.
            // The API gives us a list of results, and we piece them together.
            let transcript = '';
            for (let i = 0; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            // Store the latest full transcript in our ref.
            fullTranscriptRef.current = transcript;
        };

        recognition.onerror = (event: any) => {
            // 'aborted' is fired when we call .stop(), so we can ignore it.
            // 'no-speech' is a common, non-critical error.
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
              setError(`Speech error: ${event.error}`);
            }
            setIsListening(false);
        };
        
        recognition.onend = () => {
            setIsListening(false);
            // When recognition ends (either by calling .stop() or by timeout),
            // we send the complete transcript that we've been building.
            if (fullTranscriptRef.current) {
                onTranscriptUpdateRef.current(fullTranscriptRef.current.trim() + ' ');
                fullTranscriptRef.current = ''; // Reset for the next session.
            }
        };

        // Cleanup: ensure we stop recognition when the component unmounts.
        return () => {
            if(recognitionRef.current) {
               recognitionRef.current.abort();
            }
        };
    }, []); // This effect runs only once on component mount.
    
    return { isListening, error, toggleListening };
};
