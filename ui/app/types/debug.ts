import type { GradientStop } from './ui';
import type { AgentEvent } from './agent';
import type { ChatMessage } from './chat';

export interface DebugImagesEntry {
    type: 'images';
    componentName: string;
    imageUrls: string[];
}

export interface DebugGradientEntry {
    type: 'gradient';
    componentName: string;
    gradientStops: GradientStop[];
}

export interface DebugBookingEntry {
    type: 'booking';
    date: string;
    time: string;
    retailerName: string;
    retailerAddress?: string;
    retailerPhone?: string;
    userName: string;
    userEmail: string;
    [key: string]: unknown;
}

export type DebugAgentEventEntry = AgentEvent & {
    type: 'event';
};

export type DebugUserTextEntry = ChatMessage & {
    type: 'user-text';
};

export type DebugEntry
    = DebugImagesEntry
    | DebugGradientEntry
    | DebugBookingEntry
    | DebugAgentEventEntry
    | DebugUserTextEntry;
