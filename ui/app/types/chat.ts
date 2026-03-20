export type Sender = 'agent' | 'user';

export interface MessageContent {
    text: string;
}

export interface ChatMessage {
    id: string;
    sender: Sender;
    content: MessageContent;
    timestamp: Date;
    finished: boolean;
}
