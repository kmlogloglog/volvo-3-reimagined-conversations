import { AGENT } from '@/constants/agent.js';

export default {
    isIdle: (state) => !state.connecting && !state.connected && !state.listening && !state.speaking,

    hasConversation: (state) => state.conversation.length > 0,

    lastAgentMessage: (state) => {
        const finished = state.conversation.filter(m => m.sender === AGENT.AGENT && m.finished);
        return finished[finished.length - 1] ?? null;
    },
};
