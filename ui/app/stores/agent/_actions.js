import { AGENT } from '@/constants/agent.js';
import { BUS } from '@/constants/bus.js';
import { useEventBus } from '@vueuse/core';

const log = {
    info: (label, ...args) => console.log(`%c${label}`, 'background: linear-gradient(135deg, #4a9eff, #357abd); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', ...args),
    success: (label, ...args) => console.log(`%c${label}`, 'background: linear-gradient(135deg, #7de37d, #27ae60); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', ...args),
    warn: (label, ...args) => console.warn(`%c${label}`, 'background: linear-gradient(135deg, #ffa502, #e67e22); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.2);', ...args),
    error: (label, ...args) => console.error(`%c${label}`, 'background: linear-gradient(135deg, #ff4757, #c0392b); color: white; padding: 2px 8px; border-radius: 3px; font-weight: 500; text-shadow: 0 1px 1px rgba(0,0,0,0.3);', ...args),
};

export default {
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

    handleUserTranscription(text, finished = false) {
        if (!this.currentUserMessageId) {
            this.currentUserMessageId = `${Date.now().toString()}_${AGENT.USER}`;
            const newMsg = {
                id: this.currentUserMessageId,
                sender: AGENT.USER,
                content: { text: '' },
                timestamp: new Date(),
                finished,
            };
            this.addMessage(newMsg);
        }

        const msg = this.conversation.find(m => m.id === this.currentUserMessageId);
        if (msg && msg.content) {
            msg.content.text = text;
            msg.finished = finished;
        }
    },

    playAudioChunk(base64Data) {
        this.speaking = true;
        if (this.audioPlayerNode) {
            const arrayBuffer = this.base64ToArray(base64Data);
            this.audioPlayerNode.port.postMessage(arrayBuffer);
        }
    },

    handleTextResponse(text, finished = false) {
        if (!this.currentMessageId) {
            this.currentMessageId = `${Date.now().toString()}_${AGENT.AGENT}`;
            const newMsg = {
                id: this.currentMessageId,
                sender: AGENT.AGENT,
                content: { text: '' },
                timestamp: new Date(),
                finished,
            };
            this.addMessage(newMsg);
        }

        const msg = this.conversation.find(m => m.id === this.currentMessageId);

        if (msg && msg.content) {
            const currentText = msg.content.text || '';
            msg.finished = finished;

            if (currentText.endsWith(text) && text.length > 1) return;
            msg.content.text = `${currentText}${text}`;
        }

        if (finished) {
            this.currentMessageId = null;
        }
    },

    handleImageResponse(imageUrls) {
        this.backgroundImages = imageUrls;
    },

    handleAgentEvent(event) {
        let textHandled = false;
        if (event.content && event.content.parts) {
            for (const part of event.content.parts) {
                if (part.inlineData?.mimeType && typeof part.inlineData.mimeType === 'string' && part.inlineData.mimeType.startsWith('audio/pcm')) {
                    this.playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                    this.handleTextResponse(part.text, part.finished);
                    textHandled = true;
                }
                if (part.functionResponse?.response?.ui_action) {
                    const uiAction = part.functionResponse.response.ui_action;
                    if (uiAction.action === 'display_component') {
                        this.handleImageResponse(uiAction.data.images);
                    }
                }
            }
        }

        if (!textHandled && event.outputTranscription?.text) {
            this.handleTextResponse(event.outputTranscription.text, event.outputTranscription?.finished);
        }

        if (event.inputTranscription?.text) {
            this.handleUserTranscription(event.inputTranscription.text, event.inputTranscription?.finished);
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
        log.info('AUDIO', 'Stopping...');

        this.listening = false;
        this.speaking = false;

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioRecorderNode) {
            try {
                this.audioRecorderNode.disconnect();
                this.audioRecorderNode.port.onmessage = null;
            } catch (e) {
                log.warn('AUDIO', 'Error disconnecting recorder node:', e);
            }
            this.audioRecorderNode = null;
        }

        if (this.audioPlayerNode) {
            try {
                this.audioPlayerNode.disconnect();
                this.audioPlayerNode.port.postMessage({ command: 'clear' });
            } catch (e) {
                log.warn('AUDIO', 'Error disconnecting player node:', e);
            }
            this.audioPlayerNode = null;
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            try { this.audioContext.close(); } catch (e) { log.warn('AUDIO', 'Error closing audio context:', e); }
            this.audioContext = null;
            this.analyser = null;
        }

        if (this.recorderContext && this.recorderContext.state !== 'closed') {
            try { this.recorderContext.close(); } catch (e) { log.warn('AUDIO', 'Error closing recorder context:', e); }
            this.recorderContext = null;
            this.inputAnalyser = null;
        }

        this.audioLevel = 0;
        this.micPermissionGranted = false;
    },

    async connect() {
        if (this.connected) return Promise.resolve();
        if (this.connectionPromise) return this.connectionPromise;

        this.connecting = true;

        const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
        connectionBus.emit({ connecting: true, connected: false });

        const { $router } = useNuxtApp();

        this.connectionPromise = new Promise((resolve, reject) => {
            const userIdFromQuery = $router.currentRoute.value.query.user || 'demo-user';
            const sessionIdFromQuery = $router.currentRoute.value.query.session || crypto.randomUUID();
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const url = `${protocol}//${window.location.host}/ws/${userIdFromQuery}/${sessionIdFromQuery}`;

            log.info('WEBSOCKET', 'Connecting to:', url);
            this.websocket = new WebSocket(url);

            const timeoutId = setTimeout(() => {
                if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
                    log.error('WEBSOCKET', 'Connection timed out');
                    this.websocket.close();
                    this.connecting = false;
                    connectionBus.emit({ connecting: false, connected: false });
                    reject(new Error('Connection timed out'));
                }
            }, 5000);

            this.websocket.onopen = () => {
                clearTimeout(timeoutId);
                log.success('WEBSOCKET', 'Connected');
                this.connected = true;
                this.connecting = false;
                connectionBus.emit({ connecting: false, connected: true });
                resolve();
            };

            this.websocket.onerror = (err) => {
                clearTimeout(timeoutId);
                log.error('WEBSOCKET', 'Error:', err);
                this.connecting = false;
                connectionBus.emit({ connecting: false, connected: false });
            };

            this.websocket.onclose = (event) => {
                clearTimeout(timeoutId);
                log.warn('WEBSOCKET', `Disconnected: ${event.code} - ${event.reason}`);

                if (!this.connected) {
                    this.connecting = false;
                    connectionBus.emit({ connecting: false, connected: false });
                    reject(new Error(`Connection failed or closed: ${event.code} - ${event.reason}`));
                }

                this.connected = false;
                this.connecting = false;
                connectionBus.emit({ connecting: false, connected: false });
                this.stopAudio();
                this.connectionPromise = null;
                this.websocket = null;
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleAgentEvent(data);
                } catch (e) {
                    log.error('WEBSOCKET', 'Error parsing message:', e);
                }
            };
        });

        return this.connectionPromise;
    },

    disconnect() {
        log.warn('WEBSOCKET', 'Disconnecting...');
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.stopAudio();

        const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
        connectionBus.emit({ connecting: false, connected: false });
    },

    startLevelMonitoring(onLevelChange = null) {
        if (!this.inputAnalyser || !this.analyser) return;

        const inputDataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        const outputDataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            this.inputAnalyser.getByteFrequencyData(inputDataArray);
            this.analyser.getByteFrequencyData(outputDataArray);

            const inputLevel = Math.round(inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length);
            const outputLevel = Math.round(outputDataArray.reduce((a, b) => a + b, 0) / outputDataArray.length);

            this.audioLevel = Math.round(((Math.max(inputLevel, outputLevel)) / 255) * 1000) / 1000;
            onLevelChange?.(this.audioLevel);
        };

        draw();
    },

    async startAudio() {
        if (this.listening || this.startingAudio) return;

        log.info('AUDIO', 'Starting...');
        this.startingAudio = true;

        try {
            if (!this.mediaStream) {
                try {
                    this.mediaStream = await navigator.mediaDevices.getUserMedia({
                        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    });
                    log.success('MICROPHONE', 'Access granted');
                    this.micPermissionGranted = true;
                } catch (err) {
                    log.error('MICROPHONE', 'Access denied:', err);
                    this.micPermissionGranted = false;
                    throw err;
                }
            }

            if (!this.audioContext || this.audioContext.state === 'closed') {
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new ctxClass({ sampleRate: 24000 });
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 256;

                try {
                    await this.audioContext.audioWorklet.addModule('/js/audio-modules/pcm-player-processor.js');
                } catch (e) {
                    throw new Error(`Player worklet loading failed: ${e.message}`);
                }
            }

            if (!this.recorderContext || this.recorderContext.state === 'closed') {
                const ctxClass = window.AudioContext || window.webkitAudioContext;
                this.recorderContext = new ctxClass({ sampleRate: 16000 });
                this.inputAnalyser = this.recorderContext.createAnalyser();
                this.inputAnalyser.fftSize = 256;

                try {
                    await this.recorderContext.audioWorklet.addModule('/js/audio-modules/pcm-recorder-processor.js');
                } catch (e) {
                    throw new Error(`Recorder worklet loading failed: ${e.message}`);
                }
            }

            if (this.audioContext.state === 'suspended') await this.audioContext.resume();
            if (this.recorderContext.state === 'suspended') await this.recorderContext.resume();

            if (!this.audioPlayerNode) {
                this.audioPlayerNode = new AudioWorkletNode(this.audioContext, 'pcm-player-processor');
                this.audioPlayerNode.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
            }

            if (!this.audioRecorderNode && this.mediaStream) {
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
                } catch (err) {
                    log.error('AUDIO', 'Failed to set up recorder:', err);
                }
            }

            log.success('AUDIO', 'Started');
            this.listening = true;
            this.startLevelMonitoring();

            if (!this.connected) await this.connect();
        } catch (error) {
            log.error('AUDIO', 'Failed to start:', error);
            this.listening = false;
            this.connecting = false;
            throw error;
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
        this.addMessage({
            id: this.currentMessageId,
            sender: AGENT.AGENT,
            content: { text: '' },
            timestamp: new Date(),
            finished: false,
        });

        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            log.warn('WEBSOCKET', 'Not open, message not sent.');
            return;
        }

        this.websocket.send(JSON.stringify({ type: 'text', text }));
    },

    clearMessages() {
        this.conversation.length = 0;
    },
};
