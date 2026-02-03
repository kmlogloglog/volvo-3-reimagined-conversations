import { BUS } from '@/constants/bus.js';
import { useEventBus } from '@vueuse/core';

export function useAgent(options = {}) {
    const { onLevelChange } = options;

    // Global event bus for connection state
    const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
    // Global event bus for microphone state
    const microphoneBus = useEventBus(BUS.MICROPHONE);

    // State
    const connected = ref(false);
    const connecting = ref(false);
    const listening = ref(false);
    const speaking = ref(false);
    const messages = ref([]);
    const audioContext = ref(null);
    const analyser = ref(null);
    const inputAnalyser = ref(null);
    const isMuted = ref(false);
    const recorderContext = ref(null);
    const audioLevel = ref(0);

    // Internal state
    let startingAudio = false;
    let micPermissionGranted = false;
    let websocket = null;
    let audioPlayerNode = null;
    let audioRecorderNode = null;
    let mediaStream = null;
    let currentMessageId = null;
    let currentUserMessageId = null;
    let connectionPromise = null;
    let animationId = null;

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
        messages.value.push(msg);
    }

    function handleUserTranscription(text) {
        if (!currentUserMessageId) {
            currentUserMessageId = Date.now().toString();
            addMessage({
                id: currentUserMessageId,
                sender: 'user',
                content: { text: '' },
                type: 'text',
                isPartial: true,
                timestamp: new Date(),
            });
        }

        const msg = messages.value.find(m => m.id === currentUserMessageId);
        if (msg && msg.content) {
            msg.content.text = text;
        }
    }

    function playAudioChunk(base64Data) {
        speaking.value = true;
        if (audioPlayerNode) {
            const arrayBuffer = base64ToArray(base64Data);
            audioPlayerNode.port.postMessage(arrayBuffer);
        }
    }

    function handleTextResponse(text) {
        if (!currentMessageId) {
            currentMessageId = Date.now().toString();
            addMessage({
                id: currentMessageId,
                sender: 'agent',
                content: { text: '' },
                type: 'text',
                isPartial: true,
                timestamp: new Date(),
            });
        }

        const msg = messages.value.find(m => m.id === currentMessageId);
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
            speaking.value = false;
            currentMessageId = null;
            currentUserMessageId = null;
        }

        if (event.interrupted) {
            speaking.value = false;
            audioPlayerNode?.port.postMessage({ command: 'clear' });
        }
    }

    function stopAudio() {
        listening.value = false;
        speaking.value = false;

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        audioRecorderNode = null;

        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        audioLevel.value = 0;
        onLevelChange?.(0);
        // Reflect actual permission state - permission is still granted if user granted it
        microphoneBus.emit({ requesting: false, granted: micPermissionGranted, denied: false, ready: false });
        console.log('stop audio');
    }

    function muteAudio() {
        console.log('mute audio');
        isMuted.value = true;
    }

    function unmuteAudio() {
        console.log('unmute audio');
        isMuted.value = false;
    }

    function connect() {
        if (connected.value) {
            return Promise.resolve();
        }
        if (connectionPromise) {
            return connectionPromise;
        }

        connecting.value = true;
        connectionBus.emit({ connecting: true, connected: false });

        console.log('connecting to agent...', connecting.value);

        connectionPromise = new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;

            const userId = 'demo-user';
            const sessionId = 'demo-session-' + Math.random().toString(36).substring(7);
            const url = `${protocol}//${host}/ws/${userId}/${sessionId}`;

            console.log('Connecting to WebSocket:', url);

            websocket = new WebSocket(url);

            const timeoutId = setTimeout(() => {
                if (websocket && websocket.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket connection timed out');
                    websocket.close();
                    connecting.value = false;
                    connectionBus.emit({ connecting: false, connected: false });
                    reject(new Error('Connection timed out'));
                }
            }, 5000);

            websocket.onopen = () => {
                clearTimeout(timeoutId);
                console.log('WebSocket Connected');
                connected.value = true;
                connecting.value = false;
                connectionBus.emit({ connecting: false, connected: true });
                resolve();
            };

            websocket.onerror = (err) => {
                clearTimeout(timeoutId);
                console.error('WebSocket Error:', err);
                connecting.value = false;
                connectionBus.emit({ connecting: false, connected: false });
            };

            websocket.onclose = (event) => {
                clearTimeout(timeoutId);
                console.log('WebSocket Disconnected', event.code, event.reason);

                if (!connected.value) {
                    connecting.value = false;
                    connectionBus.emit({ connecting: false, connected: false });
                    reject(new Error(`Connection failed or closed: ${event.code}`));
                }

                connected.value = false;
                connecting.value = false;
                connectionBus.emit({ connecting: false, connected: false });
                stopAudio();
                connectionPromise = null;
            };

            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleAgentEvent(data);
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };
        });

        return connectionPromise;
    }

    function disconnect() {
        if (websocket) {
            websocket.close();
            websocket = null;
        }
        stopAudio();
    }

    async function startAudio() {
        console.log('start audio');
        if (listening.value || startingAudio) {
            return;
        }

        startingAudio = true;

        try {
            // Request microphone access immediately, before connecting
            if (!mediaStream) {
                console.log('Requesting microphone access...');
                microphoneBus.emit({ requesting: true, granted: false, denied: false });
                try {
                    mediaStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            channelCount: 1,
                        },
                    });
                    console.log('Microphone access granted');
                    micPermissionGranted = true;
                    microphoneBus.emit({ requesting: false, granted: true, denied: false });
                } catch (err) {
                    console.error('Microphone access denied or error:', err);
                    micPermissionGranted = false;
                    microphoneBus.emit({ requesting: false, granted: false, denied: true, error: err.message });
                    throw err;
                }
            }

            // Initialize Player Context (24kHz)
            if (!audioContext.value) {
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                audioContext.value = new ctxClass({ sampleRate: 24000 });
                analyser.value = audioContext.value.createAnalyser();
                analyser.value.fftSize = 256;

                try {
                    await audioContext.value.audioWorklet.addModule('/js/audio-modules/pcm-player-processor.js');
                } catch (e) {
                    console.error('Failed to load player worklet:', e);
                }
            }

            // Initialize Recorder Context (16kHz)
            if (!recorderContext.value) {
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                recorderContext.value = new ctxClass({ sampleRate: 16000 });
                inputAnalyser.value = recorderContext.value.createAnalyser();
                inputAnalyser.value.fftSize = 256;

                try {
                    await recorderContext.value.audioWorklet.addModule('/js/audio-modules/pcm-recorder-processor.js');
                } catch (e) {
                    console.error('Failed to load recorder worklet:', e);
                }
            }

            if (audioContext.value.state === 'suspended') {
                await audioContext.value.resume();
            }
            if (recorderContext.value.state === 'suspended') {
                await recorderContext.value.resume();
            }

            if (!audioPlayerNode) {
                audioPlayerNode = new AudioWorkletNode(audioContext.value, 'pcm-player-processor');
                audioPlayerNode.connect(analyser.value);
                analyser.value.connect(audioContext.value.destination);
            }

            // Set up audio recorder only after mediaStream is confirmed available
            if (!audioRecorderNode && mediaStream) {
                console.log('Setting up audio recorder with MediaStream...');
                console.log('Recorder Context Sample Rate:', recorderContext.value.sampleRate);

                try {
                    const micSource = recorderContext.value.createMediaStreamSource(mediaStream);
                    audioRecorderNode = new AudioWorkletNode(recorderContext.value, 'pcm-recorder-processor');

                    audioRecorderNode.port.onmessage = (event) => {
                        if (connected.value && websocket && websocket.readyState === WebSocket.OPEN && !isMuted.value) {
                            const int16Data = float32ToInt16(event.data);
                            websocket.send(int16Data.buffer);
                        }
                    };

                    micSource.disconnect();
                    micSource.connect(audioRecorderNode);
                    micSource.connect(inputAnalyser.value);

                    // Only start the draw function after everything is properly set up
                    const inputDataArray = new Uint8Array(inputAnalyser.value.frequencyBinCount);
                    const outputDataArray = new Uint8Array(analyser.value.frequencyBinCount);

                    (function draw() {
                        animationId = requestAnimationFrame(draw);

                        // Get frequency data from both input and output analyzers
                        inputAnalyser.value.getByteFrequencyData(inputDataArray);
                        analyser.value.getByteFrequencyData(outputDataArray);

                        // Calculate levels for both input and output
                        const inputLevel = Math.round(
                            inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length,
                        );
                        const outputLevel = Math.round(
                            outputDataArray.reduce((a, b) => a + b, 0) / outputDataArray.length,
                        );

                        // Use the highest level from either input or output
                        audioLevel.value = Math.max(inputLevel, outputLevel);
                        onLevelChange?.(audioLevel.value);
                    })();

                    console.log('Audio recorder set up successfully');
                    microphoneBus.emit({ requesting: false, granted: true, denied: false, ready: true });
                } catch (err) {
                    console.error('Failed to set up audio recorder:', err);
                    microphoneBus.emit({ requesting: false, granted: false, denied: true, error: err.message, ready: false });
                    throw err;
                }
            }

            listening.value = true;

            // Connect to WebSocket after audio setup is complete
            if (!connected.value) {
                await connect();
            }
        } catch (error) {
            console.error('Failed to start audio:', error);
            listening.value = false;
            connecting.value = false;
            connectionBus.emit({ connecting: false, connected: false });
            microphoneBus.emit({ requesting: false, granted: false, denied: true, ready: false });
        } finally {
            startingAudio = false;
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

        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not open, message added to UI but not sent.');
            return;
        }

        websocket.send(JSON.stringify({ type: 'text', text }));
    }

    function clearMessages() {
        messages.value = [];
    }

    return {
        // State
        connected,
        connecting,
        listening,
        speaking,
        isMuted,
        messages,
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
