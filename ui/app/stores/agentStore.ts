import { defineStore } from 'pinia';
import { ref } from 'vue';

// Types for messages
export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  content: {
    text?: string;
    // Add other fields if needed for booking cards etc
    [key: string]: unknown;
  };
  type: 'text' | 'booking';
  isPartial?: boolean;
  timestamp?: Date;
}

export const useAgentStore = defineStore('agent', () => {
  // State
  const connected = ref(false);
  const listening = ref(false);
  const speaking = ref(false);
  const messages = ref<ChatMessage[]>([]);
  const audioContext = ref<AudioContext | null>(null);
  const analyser = ref<AnalyserNode | null>(null); // Output analyser
  const inputAnalyser = ref<AnalyserNode | null>(null); // Input analyser
  const isMuted = ref(false);

  const recorderContext = ref<AudioContext | null>(null);

  // Internal state
  let startingAudio = false;

  function muteAudio() {
    isMuted.value = true;
  }

  function unmuteAudio() {
    isMuted.value = false;
  }

  // WebSocket and Audio internals
  let websocket: WebSocket | null = null;
  let audioPlayerNode: AudioWorkletNode | null = null;
  let audioRecorderNode: AudioWorkletNode | null = null;
  let mediaStream: MediaStream | null = null;
  // const turnActive = false; // Unused
  let currentMessageId: string | null = null;
  let currentUserMessageId: string | null = null;

  // Actions
  // Actions
  let connectionPromise: Promise<void> | null = null;

  // Helper to convert Float32 to Int16 PCM
  function float32ToInt16(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const sample = float32[i] ?? 0;
      const s = Math.max(-1, Math.min(1, sample));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  function connect(): Promise<void> {
    if (connected.value) return Promise.resolve();
    if (connectionPromise) return connectionPromise;

    connectionPromise = new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      const userId = "demo-user";
      const sessionId = "demo-session-" + Math.random().toString(36).substring(7);
      const url = `${protocol}//${host}/ws/${userId}/${sessionId}`;

      console.log('Connecting to WebSocket:', url);

      websocket = new WebSocket(url);

      // Connection timeout
      const timeoutId = setTimeout(() => {
        if (websocket && websocket.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timed out');
          websocket.close();
          reject(new Error('Connection timed out'));
        }
      }, 5000);

      websocket.onopen = () => {
        clearTimeout(timeoutId);
        console.log('WebSocket Connected');
        connected.value = true;
        resolve();
      };

      websocket.onerror = (err) => {
        clearTimeout(timeoutId);
        console.error('WebSocket Error:', err);
        // On error, onclose will typically follow, but we can reject here too.
        // don't resolve/reject twice, but safe to try.
      };

      websocket.onclose = (event) => {
        clearTimeout(timeoutId);
        console.log('WebSocket Disconnected', event.code, event.reason);

        if (!connected.value) {
          // Failed to connect
          reject(new Error(`Connection failed or closed: ${event.code}`));
        }

        connected.value = false;
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
    if (listening.value || startingAudio) return;
    startingAudio = true;

    try {
      if (!connected.value) {
        await connect();
      }

      // Initialize Player Context (24kHz)
      if (!audioContext.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctxClass = window.AudioContext || (window as any).webkitAudioContext;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ctxClass = window.AudioContext || (window as any).webkitAudioContext;
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
        audioPlayerNode.connect(analyser.value!);
        analyser.value!.connect(audioContext.value.destination);
      }

      if (!audioRecorderNode) {
        console.log('Requesting microphone access...');
        console.log('Recorder Context Sample Rate:', recorderContext.value!.sampleRate);

        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              // sampleRate: 16000, // Let the context handle resampling
            }
          });
          console.log('Microphone access granted');
        } catch (err) {
          console.error('Microphone access denied or error:', err);
          throw err;
        }

        // Use recorderContext for the microphone
        const micSource = recorderContext.value.createMediaStreamSource(mediaStream);
        audioRecorderNode = new AudioWorkletNode(recorderContext.value, 'pcm-recorder-processor');

        audioRecorderNode.port.onmessage = (event) => {
          // Send audio only if connected AND NOT MUTED
          if (connected.value && websocket && websocket.readyState === WebSocket.OPEN && !isMuted.value) {
            // Convert Float32Array to Int16Array
            const int16Data = float32ToInt16(event.data);
            websocket.send(int16Data.buffer);
          }
        };

        micSource.disconnect();
        micSource.connect(audioRecorderNode);

        // Connect mic to inputAnalyser (and nowhere else to avoid feedback)
        micSource.connect(inputAnalyser.value!);
      }

      listening.value = true;

    } catch (error) {
      console.error('Failed to start audio:', error);
      listening.value = false;
      // Optionally disconnect if start failed?
    } finally {
      startingAudio = false;
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

    // We might want to suspend or close contexts, but restarting them is expensive.
    // Ideally we keep them alive but just stop the stream.
  }

  function sendMessage(text: string) {
    // Optimistically add message
    addMessage({
      id: Date.now().toString(),
      sender: 'user',
      content: { text },
      type: 'text',
      timestamp: new Date()
    });

    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not open, message added to UI but not sent.');
      return;
    }

    websocket.send(JSON.stringify({ type: 'text', text }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleAgentEvent(event: any) {
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

  function handleUserTranscription(text: string) {
    if (!currentUserMessageId) {
      currentUserMessageId = Date.now().toString();
      addMessage({
        id: currentUserMessageId,
        sender: 'user',
        content: { text: '' },
        type: 'text',
        isPartial: true,
        timestamp: new Date()
      });
    }

    const msg = messages.value.find(m => m.id === currentUserMessageId);
    if (msg && msg.content) {
      msg.content.text = text;
    }
  }

  function playAudioChunk(base64Data: string) {
    speaking.value = true;
    if (audioPlayerNode) {
      const arrayBuffer = base64ToArray(base64Data);
      audioPlayerNode.port.postMessage(arrayBuffer);
    }
  }

  function base64ToArray(base64: string) {
    // Fix URL-safe base64 and standard padding
    const base64Clean = base64.replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = window.atob(base64Clean);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  function handleTextResponse(text: string, _isTranscription = false) {
    if (!currentMessageId) {
      currentMessageId = Date.now().toString();
      addMessage({
        id: currentMessageId,
        sender: 'agent',
        content: { text: '' },
        type: 'text',
        isPartial: true,
        timestamp: new Date()
      });
    }

    const msg = messages.value.find(m => m.id === currentMessageId);
    if (msg && msg.content) {
      const currentText = msg.content.text || '';
      // Simple deduplication: if new text is exactly what we just added at the end (for large chunks)
      // or if it's a perfect repeat of the existing text.
      if (currentText.endsWith(text) && text.length > 1) {
        console.log('Skipping duplicate text chunk:', text);
        return;
      }

      msg.content.text = currentText + text;
    }
  }

  function addMessage(msg: ChatMessage) {
    console.log('Adding message to store:', msg);
    messages.value.push(msg);
  }



  return {
    connected,
    listening,
    speaking,
    isMuted,
    messages,
    analyser,
    inputAnalyser,
    connect,
    disconnect,
    startAudio,
    stopAudio,
    muteAudio,
    unmuteAudio,
    sendMessage
  };
});
