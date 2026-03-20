import { defineStore } from 'pinia';
import type { AgentState } from './_state';
import actions from './_actions';
import getters from './_getters';
export type { AgentState } from './_state';

export const useAgentStore = defineStore('agentStore', {
    state: (): AgentState => ({
        userName: null,
        conversation: [],
        audioLevel: 0,
        backgroundImages: null,
        carouselImages: null,
        componentName: null,
        gradientStops: null,
        retailerDetails: null,
        testDriveDetails: null,

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
