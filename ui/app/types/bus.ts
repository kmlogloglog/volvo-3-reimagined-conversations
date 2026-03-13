export interface MicrophoneBusPayload {
    requesting?: boolean;
    granted?: boolean;
    denied?: boolean;
    ready?: boolean;
    error?: string;
}

export interface ConnectionBusPayload {
    connecting?: boolean;
    connected?: boolean;
}
