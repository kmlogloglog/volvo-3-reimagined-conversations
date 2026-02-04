import { BUS } from '@/constants/bus.js';
import { useEventBus } from '@vueuse/core';
import { useAgentStore } from '@/stores/agent';

export function useAgent(options = {}) {
    const { onLevelChange } = options;

    // Agent store - now contains all shared state
    const agentStore = useAgentStore();

    // Global event bus for connection state
    const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
    // Global event bus for microphone state
    const microphoneBus = useEventBus(BUS.MICROPHONE);

    // Use reactive references to store state for reactivity
    const connected = computed(() => agentStore.connected);
    const connecting = computed(() => agentStore.connecting);
    const listening = computed(() => agentStore.listening);
    const speaking = computed(() => agentStore.speaking);
    const analyser = computed(() => agentStore.analyser);
    const inputAnalyser = computed(() => agentStore.inputAnalyser);
    const isMuted = computed(() => agentStore.isMuted);
    const audioLevel = computed(() => agentStore.audioLevel);

    // Helper to convert Float32 to Int16 PCM
    function float32ToInt16(float32) {
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
            const sample = float32[i] ?? 0;
            const s = Math.max(-1, Math.min(1, sample));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16;
    }

    function base64ToArray(base64) {
        const base64Clean = base64.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = window.atob(base64Clean);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function addMessage(msg) {
        console.log('Adding message to store:', msg);
        agentStore.conversation.push(msg);
    }

    function handleUserTranscription(text) {
        if (!agentStore.currentUserMessageId) {
            agentStore.currentUserMessageId = Date.now().toString();
            addMessage({
                id: agentStore.currentUserMessageId,
                sender: 'user',
                content: { text: '' },
                type: 'text',
                isPartial: true,
                timestamp: new Date(),
            });
        }

        const msg = agentStore.conversation.find(m => m.id === agentStore.currentUserMessageId);
        if (msg && msg.content) {
            console.log(msg);
            msg.content.text = text;
        }
    }

    function playAudioChunk(base64Data) {
        agentStore.speaking = true;
        if (agentStore.audioPlayerNode) {
            const arrayBuffer = base64ToArray(base64Data);
            agentStore.audioPlayerNode.port.postMessage(arrayBuffer);
        }
    }

    function handleTextResponse(text) {
        if (!agentStore.currentMessageId) {
            agentStore.currentMessageId = Date.now().toString();
            addMessage({
                id: agentStore.currentMessageId,
                sender: 'agent',
                content: { text: '' },
                type: 'text',
                isPartial: true,
                timestamp: new Date(),
            });
        }

        const msg = agentStore.conversation.find(m => m.id === agentStore.currentMessageId);
        if (msg && msg.content) {
            const currentText = msg.content.text || '';
            if (currentText.endsWith(text) && text.length > 1) {
                console.log('Skipping duplicate text chunk:', text);
                return;
            }
            msg.content.text = currentText + text;
        }
    }

    function handleAgentEvent(event) {
        let textHandled = false;
        if (event.content && event.content.parts) {
            for (const part of event.content.parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                    playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                    handleTextResponse(part.text);
                    textHandled = true;
                }
            }
        }

        if (!textHandled && event.outputTranscription && event.outputTranscription.text) {
            handleTextResponse(event.outputTranscription.text, true);
        }

        if (event.inputTranscription && event.inputTranscription.text) {
            handleUserTranscription(event.inputTranscription.text);
        }

        if (event.turnComplete) {
            agentStore.speaking = false;
            agentStore.currentMessageId = null;
            agentStore.currentUserMessageId = null;
        }

        if (event.interrupted) {
            agentStore.speaking = false;
            agentStore.audioPlayerNode?.port.postMessage({ command: 'clear' });
        }
    }

    function stopAudio() {
        console.log('Stopping audio...');

        agentStore.listening = false;
        agentStore.speaking = false;

        // Stop and cleanup media stream
        if (agentStore.mediaStream) {
            agentStore.mediaStream.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            agentStore.mediaStream = null;
        }

        // Properly disconnect and cleanup audio recorder node
        if (agentStore.audioRecorderNode) {
            try {
                agentStore.audioRecorderNode.disconnect();
                agentStore.audioRecorderNode.port.onmessage = null;
            } catch (e) {
                console.warn('Error disconnecting audio recorder node:', e);
            }
            agentStore.audioRecorderNode = null;
        }

        // Cleanup audio player node
        if (agentStore.audioPlayerNode) {
            try {
                agentStore.audioPlayerNode.disconnect();
                agentStore.audioPlayerNode.port.postMessage({ command: 'clear' });
            } catch (e) {
                console.warn('Error disconnecting audio player node:', e);
            }
            agentStore.audioPlayerNode = null;
        }

        // Cancel animation frame
        if (agentStore.animationId) {
            cancelAnimationFrame(agentStore.animationId);
            agentStore.animationId = null;
        }

        // Close and cleanup audio contexts
        if (agentStore.audioContext && agentStore.audioContext.state !== 'closed') {
            try {
                agentStore.audioContext.close();
            } catch (e) {
                console.warn('Error closing audio context:', e);
            }
            agentStore.audioContext = null;
            agentStore.analyser = null;
        }

        if (agentStore.recorderContext && agentStore.recorderContext.state !== 'closed') {
            try {
                agentStore.recorderContext.close();
            } catch (e) {
                console.warn('Error closing recorder context:', e);
            }
            agentStore.recorderContext = null;
            agentStore.inputAnalyser = null;
        }

        agentStore.audioLevel = 0;
        onLevelChange?.(0);

        // Reflect actual permission state - permission is still granted if user granted it
        microphoneBus.emit({ requesting: false, granted: agentStore.micPermissionGranted, denied: false, ready: false });
        console.log('Audio stopped and cleaned up');
    }

    function muteAudio() {
        console.log('mute audio');
        agentStore.isMuted = true;
    }

    function unmuteAudio() {
        console.log('unmute audio');
        agentStore.isMuted = false;
    }

    function connect() {
        console.log('connect called');
        if (agentStore.connected) {
            return Promise.resolve();
        }
        if (agentStore.connectionPromise) {
            return agentStore.connectionPromise;
        }

        agentStore.connecting = true;
        connectionBus.emit({ connecting: true, connected: false });

        console.log('connecting to agent...', agentStore.connecting);

        agentStore.connectionPromise = new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;

            const userId = 'demo-user';
            const sessionId = 'demo-session-' + Math.random().toString(36).substring(7);
            const url = `${protocol}//${host}/ws/${userId}/${sessionId}`;

            console.log('Connecting to WebSocket:', url);

            agentStore.websocket = new WebSocket(url);

            const timeoutId = setTimeout(() => {
                if (agentStore.websocket && agentStore.websocket.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket connection timed out');
                    agentStore.websocket.close();
                    agentStore.connecting = false;
                    connectionBus.emit({ connecting: false, connected: false });
                    reject(new Error('Connection timed out'));
                }
            }, 5000);

            agentStore.websocket.onopen = () => {
                clearTimeout(timeoutId);
                console.log('WebSocket Connected');
                agentStore.connected = true;
                agentStore.connecting = false;
                connectionBus.emit({ connecting: false, connected: true });
                resolve();
            };

            agentStore.websocket.onerror = (err) => {
                clearTimeout(timeoutId);
                console.error('WebSocket Error:', err);
                agentStore.connecting = false;
                connectionBus.emit({ connecting: false, connected: false });
            };

            agentStore.websocket.onclose = (event) => {
                clearTimeout(timeoutId);
                console.log('WebSocket Disconnected', event.code, event.reason);

                if (!agentStore.connected) {
                    agentStore.connecting = false;
                    connectionBus.emit({ connecting: false, connected: false });
                    reject(new Error(`Connection failed or closed: ${event.code} - ${event.reason}`));
                }

                agentStore.connected = false;
                agentStore.connecting = false;
                connectionBus.emit({ connecting: false, connected: false });
                stopAudio();
                agentStore.connectionPromise = null;
                agentStore.websocket = null;
            };

            agentStore.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleAgentEvent(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
        });

        return agentStore.connectionPromise;
    }

    function disconnect() {
        console.log('disconnect called');
        if (agentStore.websocket) {
            agentStore.websocket.close();
            agentStore.websocket = null;
        }
        stopAudio();
    }

    // Audio level monitoring
    function level() {
        // Only start the draw function after everything is properly set up
        const inputDataArray = new Uint8Array(agentStore.inputAnalyser.frequencyBinCount);
        const outputDataArray = new Uint8Array(agentStore.analyser.frequencyBinCount);

        (function draw() {
            agentStore.animationId = requestAnimationFrame(draw);

            // Get frequency data from both input and output analyzers
            agentStore.inputAnalyser.getByteFrequencyData(inputDataArray);
            agentStore.analyser.getByteFrequencyData(outputDataArray);

            // Calculate levels for both input and output
            const inputLevel = Math.round(
                inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length,
            );
            const outputLevel = Math.round(
                outputDataArray.reduce((a, b) => a + b, 0) / outputDataArray.length,
            );

            // Use the highest level from either input or output
            agentStore.audioLevel = Math.max(inputLevel, outputLevel);
            onLevelChange?.(agentStore.audioLevel);
        })();
    }

    async function startAudio() {
        console.log('Starting audio...');

        if (agentStore.listening || agentStore.startingAudio) {
            console.log('Audio already starting or started, returning early');
            return;
        }

        agentStore.startingAudio = true;

        try {
            // Request microphone access immediately, before connecting
            if (!agentStore.mediaStream) {
                console.log('Requesting microphone access...');
                microphoneBus.emit({ requesting: true, granted: false, denied: false });
                try {
                    agentStore.mediaStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            channelCount: 1,
                            sampleRate: 16000,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                    });
                    console.log('Microphone access granted');
                    agentStore.micPermissionGranted = true;
                    microphoneBus.emit({ requesting: false, granted: true, denied: false });
                } catch (err) {
                    console.error('Microphone access denied or error:', err);
                    agentStore.micPermissionGranted = false;
                    microphoneBus.emit({ requesting: false, granted: false, denied: true, error: err.message });
                    throw err;
                }
            }

            // Initialize Player Context (24kHz) - always create fresh context
            if (!agentStore.audioContext || agentStore.audioContext.state === 'closed') {
                console.log('Creating new audio context for playback...');
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                agentStore.audioContext = new ctxClass({ sampleRate: 24000 });
                agentStore.analyser = agentStore.audioContext.createAnalyser();
                agentStore.analyser.fftSize = 256;

                try {
                    await agentStore.audioContext.audioWorklet.addModule('/js/audio-modules/pcm-player-processor.js');
                    console.log('Player worklet loaded successfully');
                } catch (e) {
                    console.error('Failed to load player worklet:', e);
                    throw new Error(`Player worklet loading failed: ${e.message}`);
                }
            }

            // Initialize Recorder Context (16kHz) - always create fresh context
            if (!agentStore.recorderContext || agentStore.recorderContext.state === 'closed') {
                console.log('Creating new recorder context...');
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                agentStore.recorderContext = new ctxClass({ sampleRate: 16000 });
                agentStore.inputAnalyser = agentStore.recorderContext.createAnalyser();
                agentStore.inputAnalyser.fftSize = 256;

                try {
                    await agentStore.recorderContext.audioWorklet.addModule('/js/audio-modules/pcm-recorder-processor.js');
                    console.log('Recorder worklet loaded successfully');
                } catch (e) {
                    console.error('Failed to load recorder worklet:', e);
                    throw new Error(`Recorder worklet loading failed: ${e.message}`);
                }
            }

            // Resume contexts if suspended
            if (agentStore.audioContext.state === 'suspended') {
                console.log('Resuming audio context...');
                await agentStore.audioContext.resume();
            }
            if (agentStore.recorderContext.state === 'suspended') {
                console.log('Resuming recorder context...');
                await agentStore.recorderContext.resume();
            }

            // Create fresh audio player node
            if (!agentStore.audioPlayerNode) {
                console.log('Creating audio player node...');
                agentStore.audioPlayerNode = new AudioWorkletNode(agentStore.audioContext, 'pcm-player-processor');
                agentStore.audioPlayerNode.connect(agentStore.analyser);
                agentStore.analyser.connect(agentStore.audioContext.destination);
            }

            // Set up audio recorder only after mediaStream is confirmed available
            if (!agentStore.audioRecorderNode && agentStore.mediaStream) {
                console.log('Setting up audio recorder with MediaStream...');
                console.log('Recorder Context Sample Rate:', agentStore.recorderContext.sampleRate);

                try {
                    const micSource = agentStore.recorderContext.createMediaStreamSource(agentStore.mediaStream);
                    agentStore.audioRecorderNode = new AudioWorkletNode(agentStore.recorderContext, 'pcm-recorder-processor');

                    agentStore.audioRecorderNode.port.onmessage = (event) => {
                        if (agentStore.connected && agentStore.websocket && agentStore.websocket.readyState === WebSocket.OPEN && !agentStore.isMuted) {
                            const int16Data = float32ToInt16(event.data);
                            agentStore.websocket.send(int16Data.buffer);
                        }
                    };

                    micSource.disconnect();
                    micSource.connect(agentStore.audioRecorderNode);
                    micSource.connect(agentStore.inputAnalyser);

                    // Audio level monitoring
                    level();

                    console.log('Audio recorder set up successfully');
                    microphoneBus.emit({ requesting: false, granted: true, denied: false, ready: true });
                } catch (err) {
                    console.error('Failed to set up audio recorder:', err);
                    microphoneBus.emit({ requesting: false, granted: false, denied: true, error: err.message, ready: false });
                    throw err;
                }
            }

            agentStore.listening = true;

            // Connect to WebSocket after audio setup is complete
            if (!agentStore.connected) {
                await connect();
            }
        } catch (error) {
            console.error('Failed to start audio:', error);
            agentStore.listening = false;
            agentStore.connecting = false;
            connectionBus.emit({ connecting: false, connected: false });
            microphoneBus.emit({ requesting: false, granted: false, denied: true, ready: false });
        } finally {
            agentStore.startingAudio = false;
        }
    }

    function sendMessage(text) {
        addMessage({
            id: Date.now().toString(),
            sender: 'user',
            content: { text },
            type: 'text',
            timestamp: new Date(),
        });

        if (!agentStore.websocket || agentStore.websocket.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not open, message added to UI but not sent.');
            return;
        }

        agentStore.websocket.send(JSON.stringify({ type: 'text', text }));
    }

    function clearMessages() {
        agentStore.conversation.length = 0;
    }

    return {
        // State
        connected,
        connecting,
        listening,
        speaking,
        isMuted,
        analyser,
        inputAnalyser,
        audioLevel,

        // Actions
        connect,
        disconnect,
        startAudio,
        stopAudio,
        muteAudio,
        unmuteAudio,
        sendMessage,
        clearMessages,
    };
}
