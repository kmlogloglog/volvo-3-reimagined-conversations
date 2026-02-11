import { AGENT } from '@/constants/agent.js';

export default {
    // Helper to convert Float32 to Int16 PCM
    float32ToInt16(float32) {
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
            const sample = float32[i] ?? 0;
            const s = Math.max(-1, Math.min(1, sample));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16;
    },

    base64ToArray(base64) {
        const base64Clean = base64.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = window.atob(base64Clean);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    },

    addMessage(msg) {
        this.conversation.push(msg);
    },

    handleUserTranscription(text, finished) {
        if (!this.currentUserMessageId) {
            this.currentUserMessageId = Date.now().toString();
            const newMsg = {
                id: this.currentUserMessageId,
                sender: AGENT.USER,
                content: { text: '' },
                timestamp: new Date(),
            };
            if (finished != null) {
                newMsg.finished = finished;
            }
            this.addMessage(newMsg);
        }

        const msg = this.conversation.find(m => m.id === this.currentUserMessageId);
        if (msg && msg.content) {
            msg.content.text = text;
        }
    },

    playAudioChunk(base64Data) {
        this.speaking = true;
        if (this.audioPlayerNode) {
            const arrayBuffer = this.base64ToArray(base64Data);
            this.audioPlayerNode.port.postMessage(arrayBuffer);
        }
    },

    handleTextResponse(text, finished) {
        if (!this.currentMessageId) {
            this.currentMessageId = Date.now().toString();
            const newMsg = {
                id: this.currentMessageId,
                sender: AGENT.AGENT,
                content: { text: '' },
                timestamp: new Date(),
            };
            if (finished != null) {
                newMsg.finished = finished;
            }
            this.addMessage(newMsg);
        }

        const msg = this.conversation.find(m => m.id === this.currentMessageId);

        if (msg && msg.content) {
            const currentText = msg.content.text || '';
            if (finished != null) {
                msg.finished = finished;
            }

            // Prevent duplicate text appending if the same text is received again
            if (currentText.endsWith(text) && text.length > 1) {
                return;
            }
            msg.content.text = `${currentText}${text}`;
        }
    },

    handleImageResponse(imageUrls) {
        this.backgroundImages = imageUrls;
    },

    handleAgentEvent(event) {
        let textHandled = false;
        if (event.content && event.content.parts) {
            for (const part of event.content.parts) {
                //handle audio parts
                if (part.inlineData?.mimeType && typeof part.inlineData.mimeType === 'string' && part.inlineData.mimeType.startsWith('audio/pcm')) {
                    this.playAudioChunk(part.inlineData.data);
                }
                // handle text parts
                if (part.text) {
                    console.log(part);
                    this.handleTextResponse(part.text, part.finished);
                    textHandled = true;
                }
                // handle images
                if (part.functionResponse?.response?.ui_action) {
                    const uiAction = part.functionResponse.response.ui_action;

                    if (uiAction.action === 'display_component') {
                        this.handleImageResponse(uiAction.data.images);
                    }
                }
            }
        }

        if (!textHandled && !event.partial && event.outputTranscription?.text) {
            console.log(event.outputTranscription);
            this.handleTextResponse(event.outputTranscription.text, event.outputTranscription?.finished);
        }

        if (event.inputTranscription?.text) {
            this.handleUserTranscription(event.inputTranscription.text, event.outputTranscription?.finished);
        }

        if (event.turnComplete) {
            this.speaking = false;
            this.currentMessageId = null;
            this.currentUserMessageId = null;
        }

        if (event.interrupted) {
            this.speaking = false;
            this.audioPlayerNode?.port.postMessage({ command: 'clear' });
        }
    },

    stopAudio() {
        console.log('%cAUDIO STOP', 'background: linear-gradient(135deg, #4a9eff, #357abd); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Stopping audio...');

        this.listening = false;
        this.speaking = false;

        // Stop and cleanup media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => {
                console.log('%cAUDIO TRACK', 'background: linear-gradient(135deg, #4a9eff, #357abd); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Stopping track:', track.kind);
                track.stop();
            });
            this.mediaStream = null;
        }

        // Properly disconnect and cleanup audio recorder node
        if (this.audioRecorderNode) {
            try {
                this.audioRecorderNode.disconnect();
                this.audioRecorderNode.port.onmessage = null;
            } catch (e) {
                console.warn('%cAUDIO WARNING', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Error disconnecting audio recorder node:', e);
            }
            this.audioRecorderNode = null;
        }

        // Cleanup audio player node
        if (this.audioPlayerNode) {
            try {
                this.audioPlayerNode.disconnect();
                this.audioPlayerNode.port.postMessage({ command: 'clear' });
            } catch (e) {
                console.warn('%cAUDIO WARNING', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Error disconnecting audio player node:', e);
            }
            this.audioPlayerNode = null;
        }

        // Cancel animation frame
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Close and cleanup audio contexts
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) {
                console.warn('%cAUDIO WARNING', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Error closing audio context:', e);
            }
            this.audioContext = null;
            this.analyser = null;
        }

        if (this.recorderContext && this.recorderContext.state !== 'closed') {
            try {
                this.recorderContext.close();
            } catch (e) {
                console.warn('%cAUDIO WARNING', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Error closing recorder context:', e);
            }
            this.recorderContext = null;
            this.inputAnalyser = null;
        }

        this.audioLevel = 0;
        this.micPermissionGranted = false; // Reset permission state after stopping
    },

    async connect() {
        console.log('%cCONNECT', 'background: linear-gradient(135deg, #4a9eff, #357abd); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'called');
        if (this.connected) {
            return Promise.resolve();
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connecting = true;

        console.log('%cWEBSOCKET', 'background: linear-gradient(135deg, #4a9eff, #357abd); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'connecting to agent...');

        this.connectionPromise = new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;

            const userId = 'demo-user';
            const sessionId = 'demo-session-' + Math.random().toString(36).substring(7);
            const url = `${protocol}//${host}/ws/${userId}/${sessionId}`;

            console.log('%cWEBSOCKET', 'background: linear-gradient(135deg, #4a9eff, #357abd); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Connecting to:', url);

            this.websocket = new WebSocket(url);

            const timeoutId = setTimeout(() => {
                if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
                    console.error('%cWEBSOCKET ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'WebSocket connection timed out');
                    this.websocket.close();
                    this.connecting = false;
                    reject(new Error('Connection timed out'));
                }
            }, 5000);

            this.websocket.onopen = () => {
                clearTimeout(timeoutId);
                console.log('%cWEBSOCKET', 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Connected');
                this.connected = true;
                this.connecting = false;
                resolve();
            };

            this.websocket.onerror = (err) => {
                clearTimeout(timeoutId);
                console.error('%cWEBSOCKET ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', err);
                this.connecting = false;
            };

            this.websocket.onclose = (event) => {
                clearTimeout(timeoutId);
                console.log('%cWEBSOCKET', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Disconnected', event.code, event.reason);

                if (!this.connected) {
                    this.connecting = false;
                    reject(new Error(`Connection failed or closed: ${event.code} - ${event.reason}`));
                }

                this.connected = false;
                this.connecting = false;
                this.stopAudio();
                this.connectionPromise = null;
                this.websocket = null;
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleAgentEvent(data);
                } catch (e) {
                    console.error('%cWEBSOCKET ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Error parsing WebSocket message:', e);
                }
            };
        });

        return this.connectionPromise;
    },

    disconnect() {
        console.log('%cDISCONNECT', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'called');
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.stopAudio();
    },

    // Audio level monitoring - separate method that can be called from composable with callback
    startLevelMonitoring(onLevelChange = null) {
        if (!this.inputAnalyser || !this.analyser) return;

        // Only start the draw function after everything is properly set up
        const inputDataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        const outputDataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const draw = () => {
            this.animationId = requestAnimationFrame(draw);

            // Get frequency data from both input and output analyzers
            this.inputAnalyser.getByteFrequencyData(inputDataArray);
            this.analyser.getByteFrequencyData(outputDataArray);

            // Calculate levels for both input and output
            const inputLevel = Math.round(
                inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length,
            );
            const outputLevel = Math.round(
                outputDataArray.reduce((a, b) => a + b, 0) / outputDataArray.length,
            );

            // Use the highest level from either input or output
            this.audioLevel = Math.max(inputLevel, outputLevel);

            // Call optional callback if provided
            onLevelChange?.(this.audioLevel);
        };

        draw();
    },

    async startAudio() {
        console.log('%cAUDIO START', 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Starting audio...');

        if (this.listening || this.startingAudio) {
            console.log('%cAUDIO START', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Audio already starting or started, returning early');
            return;
        }

        this.startingAudio = true;

        try {
            // Request microphone access immediately, before connecting
            if (!this.mediaStream) {
                console.log('%cMICROPHONE', 'background: linear-gradient(135deg, #5f27cd, #341f97); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Requesting microphone access...');
                try {
                    this.mediaStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            channelCount: 1,
                            sampleRate: 16000,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                    });
                    console.log('%cMICROPHONE', 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Microphone access granted');
                    this.micPermissionGranted = true;
                } catch (err) {
                    console.error('%cMICROPHONE ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Microphone access denied or error:', err);
                    this.micPermissionGranted = false;
                    throw err;
                }
            }

            // Initialize Player Context (24kHz) - always create fresh context
            if (!this.audioContext || this.audioContext.state === 'closed') {
                console.log('%cAUDIO CONTEXT', 'background: linear-gradient(135deg, #3742fa, #273bd6); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Creating new audio context for playback...');
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new ctxClass({ sampleRate: 24000 });
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;

                try {
                    await this.audioContext.audioWorklet.addModule('/js/audio-modules/pcm-player-processor.js');
                    console.log('%cWORKLET', 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Player worklet loaded successfully');
                } catch (e) {
                    console.error('%cWORKLET ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Failed to load player worklet:', e);
                    throw new Error(`Player worklet loading failed: ${e.message}`);
                }
            }

            // Initialize Recorder Context (16kHz) - always create fresh context
            if (!this.recorderContext || this.recorderContext.state === 'closed') {
                console.log('%cRECORDER CONTEXT', 'background: linear-gradient(135deg, #3742fa, #273bd6); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Creating new recorder context...');
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                this.recorderContext = new ctxClass({ sampleRate: 16000 });
                this.inputAnalyser = this.recorderContext.createAnalyser();
                this.inputAnalyser.fftSize = 256;

                try {
                    await this.recorderContext.audioWorklet.addModule('/js/audio-modules/pcm-recorder-processor.js');
                    console.log('%cWORKLET', 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Recorder worklet loaded successfully');
                } catch (e) {
                    console.error('%cWORKLET ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Failed to load recorder worklet:', e);
                    throw new Error(`Recorder worklet loading failed: ${e.message}`);
                }
            }

            // Resume contexts if suspended
            if (this.audioContext.state === 'suspended') {
                console.log('%cAUDIO CONTEXT', 'background: linear-gradient(135deg, #3742fa, #273bd6); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Resuming audio context...');
                await this.audioContext.resume();
            }
            if (this.recorderContext.state === 'suspended') {
                console.log('%cRECORDER CONTEXT', 'background: linear-gradient(135deg, #3742fa, #273bd6); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Resuming recorder context...');
                await this.recorderContext.resume();
            }

            // Create fresh audio player node
            if (!this.audioPlayerNode) {
                console.log('%cAUDIO PLAYER', 'background: linear-gradient(135deg, #2f3542, #222831); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Creating audio player node...');
                this.audioPlayerNode = new AudioWorkletNode(this.audioContext, 'pcm-player-processor');
                this.audioPlayerNode.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }

            // Set up audio recorder only after mediaStream is confirmed available
            if (!this.audioRecorderNode && this.mediaStream) {
                console.log('%cAUDIO RECORDER', 'background: linear-gradient(135deg, #2f3542, #222831); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Setting up audio recorder with MediaStream...');
                console.log('%cSAMPLE RATE', 'background: linear-gradient(135deg, #747d8c, #57606f); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Recorder Context Sample Rate:', this.recorderContext.sampleRate);

                try {
                    const micSource = this.recorderContext.createMediaStreamSource(this.mediaStream);
                    this.audioRecorderNode = new AudioWorkletNode(this.recorderContext, 'pcm-recorder-processor');

                    this.audioRecorderNode.port.onmessage = (event) => {
                        if (this.connected && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                            const int16Data = this.float32ToInt16(event.data);
                            this.websocket.send(int16Data.buffer);
                        }
                    };

                    micSource.disconnect();
                    micSource.connect(this.audioRecorderNode);
                    micSource.connect(this.inputAnalyser);

                    console.log('%cAUDIO RECORDER', 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'Audio recorder set up successfully');
                } catch (err) {
                    console.error('%cAUDIO RECORDER ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Failed to set up audio recorder:', err);
                }
            }

            this.listening = true;

            // Always start level monitoring when audio starts
            this.startLevelMonitoring();

            // Connect to WebSocket after audio setup is complete
            if (!this.connected) {
                await this.connect();
            }
        } catch (error) {
            console.error('%cAUDIO START ERROR', 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', 'Failed to start audio:', error);
            this.listening = false;
            this.connecting = false;
        } finally {
            this.startingAudio = false;
        }
    },

    sendMessage(text) {
        this.addMessage({
            id: `${Date.now().toString()}_${AGENT.USER}`,
            sender: AGENT.USER,
            content: { text },
            timestamp: new Date(),
        });

        this.currentMessageId = `${Date.now().toString()}_${AGENT.AGENT}`;

        // Add a pending agent message with empty text
        this.addMessage({
            id: this.currentMessageId,
            sender: AGENT.AGENT,
            content: { text: '' },
            timestamp: new Date(),
            finished: false,
        });

        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            console.warn('%cWEBSOCKET WARNING', 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', 'WebSocket not open, message added to UI but not sent.');
            return;
        }

        this.websocket.send(JSON.stringify({ type: 'text', text }));
    },

    clearMessages() {
        this.conversation.length = 0;
    },
};
