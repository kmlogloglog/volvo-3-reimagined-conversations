import type { ChatMessage } from '@/types/chat';
import type { RetailerDetails, TestDriveDetails } from '@/types/agent';
import type { GradientStop } from '@/types/ui';

export interface AgentState {
    userName: string | null;
    conversation: ChatMessage[];
    audioLevel: number;
    backgroundImages: string[] | null;
    carouselImages: string[] | null;
    componentName: string | null;
    gradientStops: GradientStop[] | null;
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
    muted: boolean;
}
