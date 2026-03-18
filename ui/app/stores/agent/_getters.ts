import { AGENT } from '@/constants/agent';
import type { AgentState } from '@/stores/agent';
import type { ChatMessage } from '@/types/chat';

export default {
    isIdle: (state: AgentState): boolean => !state.connecting && !state.connected && !state.listening && !state.speaking,

    hasConversation: (state: AgentState): boolean => state.conversation.length > 0,

    lastAgentMessage: (state: AgentState): ChatMessage | null => {
        const finished = state.conversation.filter(m => m.sender === AGENT.AGENT && m.finished);
        return finished[finished.length - 1] ?? null;
    },
};
