import { AGENT } from '@/constants/agent';
import { BUS } from '@/constants/bus';
import { useEventBus } from '@vueuse/core';
import { useDebugLog, log } from '@/composables/useDebugLog';
import type { ChatMessage } from '@/types/chat';
import type { AgentEvent, ConnectParams, Coordinates } from '@/types/agent';
import type { GradientStop } from '@/types/ui';
import type { AgentState } from './_state';

declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}

function makeActions<T extends object>(obj: T & ThisType<AgentState & T>): T {
    return obj;
}

export default makeActions({
    // Converts Float32 audio samples (–1…1) to Int16 PCM for WebSocket transmission.
    float32ToInt16(float32: Float32Array): Int16Array {
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
            const sample = float32[i] ?? 0;
            const s = Math.max(-1, Math.min(1, sample));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return int16;
    },

    // Converts URL-safe base64 (ADK format) to ArrayBuffer for audio playback.
    base64ToArray(base64: string): ArrayBuffer {
        const base64Clean = base64.replace(/-/g, '+').replace(/_/g, '/');
        const binaryString = atob(base64Clean);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    },

    addMessage(msg: ChatMessage): void {
        this.conversation.push(msg);
    },

    handleUserTranscription(text: string, finished = false): void {
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

    playAudioChunk(base64Data: string): void {
        this.speaking = true;
        if (this.audioPlayerNode) {
            const arrayBuffer = this.base64ToArray(base64Data);
            this.audioPlayerNode.port.postMessage(arrayBuffer);
        }
    },

    handleTextResponse(text: string, finished = false): void {
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

            // ADK sometimes resends the last chunk.
            if (currentText.endsWith(text) && text.length > 1) return;
            msg.content.text = `${currentText}${text}`;
        }

        // Remove stale in-progress agent messages so only the latest accumulates.
        this.conversation = this.conversation.filter(msg => msg.id === this.currentMessageId || msg.sender !== AGENT.AGENT || msg.finished);

        if (finished) {
            this.currentMessageId = null;
        }
    },

    handleImageResponse(imageUrls: string[], componentName: string, gradientStops?: GradientStop[]): void {
        log.info('IMAGES', imageUrls);
        this.backgroundImages = imageUrls;
        this.componentName = componentName;
        this.gradientStops = gradientStops ?? null;

        if (componentName === AGENT.COMPONENT_NAME.FINAL_CONFIGURATION) {
            this.carouselImages = imageUrls;
        }
    },

    handleAgentEvent(event: AgentEvent): void {
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

                const uiAction = part.functionResponse?.response?.ui_action;

                if (uiAction?.action === AGENT.RESPONSE_ACTION.DISPLAY_COMPONENT) {
                    useDebugLog().record(event as Record<string, unknown>);
                    const functionName = part.functionResponse?.name;
                    const componentName = uiAction.component_name;

                    if (Object.values(AGENT.COMPONENT_NAME).includes(componentName as string)) {
                        const selectedColor = uiAction.data?.selected_color as Record<string, unknown> | undefined;
                        const gradientStops = (
                            (uiAction.data?.gradient_stops as GradientStop[] | undefined)
                            ?? (selectedColor?.gradient_stops as GradientStop[] | undefined)
                        );

                        if (componentName === AGENT.COMPONENT_NAME.TEST_DRIVE_CONFIRMATION
                            || componentName === AGENT.COMPONENT_NAME.MAPS_VIEW) {
                            // Restore carousel images saved during FINAL_CONFIGURATION,
                            // since backgroundImages may have been overwritten by
                            // intermediate steps like WHEELS or INTERIOR.
                            this.backgroundImages = this.carouselImages;
                            this.componentName = componentName;
                        } else {
                            this.handleImageResponse(
                                (uiAction.data?.images as string[]) ?? [],
                                componentName as string,
                                gradientStops,
                            );
                        }
                    }

                    if (functionName === AGENT.RESPONSE_NAME.FIND_RETAILER) {
                        this.retailerDetails = {
                            retailerName: (uiAction.data?.retailer_name as string) ?? '',
                            retailerAddress: (uiAction.data?.address as string) ?? '',
                            retailerLocation: (uiAction.data?.location as string) ?? '',
                            retailerId: (uiAction.data?.retailer_id as string) ?? '',
                            retailerCoordinates: {
                                lat: (uiAction.data?.retailer_lat as number) ?? 0,
                                lng: (uiAction.data?.retailer_lng as number) ?? 0,
                            },
                        };
                    }

                    if (functionName === AGENT.RESPONSE_NAME.BOOK_TEST_DRIVE) {
                        const prefs = uiAction.data?.preferences as Record<string, unknown> | undefined;
                        this.testDriveDetails = {
                            date: (uiAction.data?.date as string) ?? '',
                            time: (uiAction.data?.time as string) ?? '',
                            retailerName: (uiAction.data?.retailer_name as string) ?? '',
                            retailerAddress: (uiAction.data?.retailer_address as string) ?? undefined,
                            retailerPhone: (uiAction.data?.retailer_phone as string) ?? undefined,
                            retailerCoordinates: (uiAction.data?.retailer_location as Coordinates) ?? { lat: null, lng: null },
                            userName: (uiAction.data?.user_name as string) ?? '',
                            userEmail: (uiAction.data?.user_email as string) ?? '',
                            preferences: {
                                height: (prefs?.height as string) ?? null,
                                music: (prefs?.music as string) ?? null,
                                light: (prefs?.light as string) ?? null,
                            },
                        };
                    }

                    log.info('Function', `Name: ${functionName}`);
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
            const debugLog = useDebugLog();
            const userMsg = this.currentUserMessageId
                ? this.conversation.find(m => m.id === this.currentUserMessageId)
                : null;
            const agentMsg = this.currentMessageId
                ? this.conversation.find(m => m.id === this.currentMessageId)
                : null;
            if (userMsg?.content?.text) debugLog.record({ ...event, author: 'user', text: userMsg.content.text } as Record<string, unknown>);
            if (agentMsg?.content?.text) debugLog.record({ ...event, author: (event as Record<string, unknown>).author ?? 'agent', text: agentMsg.content.text } as Record<string, unknown>);

            this.speaking = false;
            this.currentMessageId = null;
            this.currentUserMessageId = null;
        }

        if (event.interrupted) {
            this.speaking = false;
            this.audioPlayerNode?.port.postMessage({ command: 'clear' });
        }
    },

    stopAudio(): void {
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

    async connect({ userId, sessionId }: ConnectParams = {}): Promise<void> {
        if (this.connected) return Promise.resolve();
        if (this.connectionPromise) return this.connectionPromise;

        this.connecting = true;

        const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
        connectionBus.emit({ connecting: true, connected: false });

        this.connectionPromise = new Promise((resolve, reject) => {
            const userIdFromQuery = userId || this.userName;
            const sessionIdFromQuery = sessionId || crypto.randomUUID();
            useDebugLog().setSession(userIdFromQuery ?? null, sessionIdFromQuery);
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

                // Drop unfinished agent messages so ChatTypeIndicator doesn't get stuck.
                this.conversation = this.conversation.filter(
                    msg => msg.sender !== AGENT.AGENT || msg.finished,
                );
                this.currentMessageId = null;
                this.currentUserMessageId = null;
                this.speaking = false;
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

    disconnect(): void {
        log.warn('WEBSOCKET', 'Disconnecting...');
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.stopAudio();

        const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
        connectionBus.emit({ connecting: false, connected: false });
    },

    startLevelMonitoring(onLevelChange: ((level: number) => void) | null = null): void {
        if (!this.inputAnalyser || !this.analyser) {
            return;
        }

        const inputAnalyser = this.inputAnalyser;
        const analyser = this.analyser;

        const inputDataArray = new Uint8Array(inputAnalyser.frequencyBinCount);
        const outputDataArray = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            inputAnalyser.getByteFrequencyData(inputDataArray);
            analyser.getByteFrequencyData(outputDataArray);

            const inputLevel = Math.round(inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length);
            const outputLevel = Math.round(outputDataArray.reduce((a, b) => a + b, 0) / outputDataArray.length);

            this.audioLevel = Math.round(((Math.max(inputLevel, outputLevel)) / 255) * 1000) / 1000;
            onLevelChange?.(this.audioLevel);
        };

        draw();
    },

    async startAudio(): Promise<void> {
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
                    throw new Error(`Player worklet loading failed: ${(e as Error).message}`);
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
                    throw new Error(`Recorder worklet loading failed: ${(e as Error).message}`);
                }
            }

            if (this.audioContext.state === 'suspended') await this.audioContext.resume();
            if (this.recorderContext.state === 'suspended') await this.recorderContext.resume();

            if (!this.audioPlayerNode) {
                this.audioPlayerNode = new AudioWorkletNode(this.audioContext, 'pcm-player-processor');
                this.audioPlayerNode.connect(this.analyser!);
                this.analyser!.connect(this.audioContext.destination);
            }

            // Connect before setting up the recorder so no chunks are dropped
            if (!this.connected) {
                await this.connect();
            }

            if (!this.audioRecorderNode && this.mediaStream) {
                try {
                    const micSource = this.recorderContext.createMediaStreamSource(this.mediaStream);
                    this.audioRecorderNode = new AudioWorkletNode(this.recorderContext, 'pcm-recorder-processor');

                    this.audioRecorderNode.port.onmessage = (event) => {
                        if (!this.connected || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
                            log.warn('AUDIO', 'Chunk skipped — connected:', this.connected, 'readyState:', this.websocket?.readyState);
                            return;
                        }
                        const int16Data = this.float32ToInt16(event.data);
                        this.websocket.send(int16Data.buffer);
                    };

                    micSource.disconnect();
                    micSource.connect(this.audioRecorderNode);
                    micSource.connect(this.inputAnalyser!);
                } catch (err) {
                    log.error('AUDIO', 'Failed to set up recorder:', err);
                }
            }

            log.success('AUDIO', 'Started');
            this.listening = true;
            this.startLevelMonitoring();
        } catch (error) {
            log.error('AUDIO', 'Failed to start:', error);
            this.listening = false;
            this.connecting = false;
            throw error;
        } finally {
            this.startingAudio = false;
        }
    },

    sendMessage(text: string): void {
        this.addMessage({
            id: `${Date.now().toString()}_${AGENT.USER}`,
            sender: AGENT.USER,
            content: { text },
            timestamp: new Date(),
            finished: true,
        });
        useDebugLog().record({ author: AGENT.USER, text });

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

    clearMessages(): void {
        this.conversation.length = 0;
    },

    set_userName(name: string): void {
        this.userName = name;
    },

    setUserName(name: string): void {
        this.userName = name;
    },
});
