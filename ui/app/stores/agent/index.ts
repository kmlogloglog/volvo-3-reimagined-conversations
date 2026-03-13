import { defineStore } from 'pinia';
import type { ChatMessage } from '@/types/chat';
import type { RetailerDetails, TestDriveDetails } from '@/types/agent';
import actions from './_actions';
import getters from './_getters';

export interface AgentState {
    userName: string | null;
    conversation: ChatMessage[];
    audioLevel: number;
    backgroundImages: string[] | null;
    phase: number;
    retailerDetails: RetailerDetails | null;
    testDriveDetails: TestDriveDetails | null;
    connected: boolean;
    connecting: boolean;
    listening: boolean;
    speaking: boolean;
    audioContext: AudioContext | null;
    analyser: AnalyserNode | null;
    inputAnalyser: AnalyserNode | null;
    recorderContext: AudioContext | null;
    websocket: WebSocket | null;
    mediaStream: MediaStream | null;
    audioPlayerNode: AudioWorkletNode | null;
    audioRecorderNode: AudioWorkletNode | null;
    currentMessageId: string | null;
    currentUserMessageId: string | null;
    connectionPromise: Promise<void> | null;
    animationId: number | null;
    startingAudio: boolean;
    micPermissionGranted: boolean;
}

export const useAgentStore = defineStore('agentStore', {
    state: (): AgentState => ({
        userName: null,
        conversation: [],
        audioLevel: 0,
        backgroundImages: null,
        phase: -1,
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
