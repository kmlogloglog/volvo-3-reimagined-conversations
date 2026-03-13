export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RetailerDetails {
    retailerName: string;
    retailerAddress: string;
    retailerLocation: string;
    retailerId: string;
    retailerCoordinates: Coordinates;
}

export interface TestDriveDetails {
    date: string;
    time: string;
    retailerName: string;
    retailerAddress: string;
    retailerCoordinates: Coordinates;
    userName: string;
    userEmail: string;
}

export interface ConnectParams {
    userId?: string;
    sessionId?: string;
}

interface InlineData {
    mimeType: string;
    data: string;
}

interface FunctionResponse {
    name: string;
    response: {
        ui_action?: {
            action: string;
            phase?: number;
            data?: Record<string, unknown>;
        };
    };
}

interface EventPart {
    text?: string;
    finished?: boolean;
    inlineData?: InlineData;
    functionResponse?: FunctionResponse;
}

interface EventContent {
    parts: EventPart[];
}

interface Transcription {
    text: string;
    finished?: boolean;
}

export interface AgentEvent {
    content?: EventContent;
    outputTranscription?: Transcription;
    inputTranscription?: Transcription;
    turnComplete?: boolean;
    interrupted?: boolean;
}
