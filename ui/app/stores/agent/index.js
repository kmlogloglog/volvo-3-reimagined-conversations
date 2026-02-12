import { defineStore } from 'pinia';
import actions from './_actions';
import getters from './_getters';

export const useAgentStore = defineStore('agentStore', {
    state: () => ({
        conversation: [],
        audioLevel: 0,
        backgroundImages: null,

        // Connection state
        connected: false,
        connecting: false,
        listening: false,
        speaking: false,

        // Audio contexts and analyzers
        audioContext: null,
        analyser: null,
        inputAnalyser: null,
        recorderContext: null,

        // Internal connection state
        websocket: null,
        mediaStream: null,
        audioPlayerNode: null,
        audioRecorderNode: null,
        currentMessageId: null,
        currentUserMessageId: null,
        connectionPromise: null,
        animationId: null,
        startingAudio: false,
        micPermissionGranted: false,
    }),
    actions,
    getters,
});
