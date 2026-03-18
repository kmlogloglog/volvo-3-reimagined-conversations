export interface Coordinates {
    lat: number | null;
    lng: number | null;
}

export interface RetailerDetails {
    retailerName: string;
    retailerAddress: string | null;
    retailerLocation: string;
    retailerId: string;
    retailerCoordinates: Coordinates;
}

export interface TestDrivePreferences {
    height: string | null;
    music: string | null;
    light: string | null;
}

export interface TestDriveDetails {
    date: string;
    time: string;
    retailerName: string;
    retailerAddress: string | undefined;
    retailerPhone: string | undefined;
    retailerCoordinates: Coordinates;
    userName: string;
    userEmail: string;
    preferences: TestDrivePreferences;
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
            component_name?: string;
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
