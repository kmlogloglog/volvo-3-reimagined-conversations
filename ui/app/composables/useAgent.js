import { BUS } from '@/constants/bus.js';
import { useEventBus } from '@vueuse/core';
import { useAgentStore } from '@/stores/agent';

export function useAgent(options = {}) {
    const { onLevelChange } = options;

    const agentStore = useAgentStore();

    const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
    const microphoneBus = useEventBus(BUS.MICROPHONE);

    async function startAudio() {
        try {
            microphoneBus.emit({ requesting: true, granted: false, denied: false });
            await agentStore.startAudio();

            if (onLevelChange && agentStore.inputAnalyser && agentStore.analyser) {
                if (agentStore.animationId) {
                    cancelAnimationFrame(agentStore.animationId);
                }
                agentStore.startLevelMonitoring(onLevelChange);
            }

            microphoneBus.emit({ requesting: false, granted: true, denied: false, ready: true });
        } catch (error) {
            microphoneBus.emit({ requesting: false, granted: false, denied: true, error: error.message, ready: false });
            throw error;
        }
    }

    function stopAudio() {
        agentStore.stopAudio();
        microphoneBus.emit({ requesting: false, ready: false });
        onLevelChange?.(0);
    }

    async function connect() {
        try {
            connectionBus.emit({ connecting: true, connected: false });
            await agentStore.connect();
            connectionBus.emit({ connecting: false, connected: true });
        } catch (error) {
            connectionBus.emit({ connecting: false, connected: false });
            throw error;
        }
    }

    function disconnect() {
        agentStore.disconnect();
        connectionBus.emit({ connecting: false, connected: false });
    }

    const sendMessage = (text) => agentStore.sendMessage(text);
    const clearMessages = () => agentStore.clearMessages();

    return {
        connect,
        disconnect,
        startAudio,
        stopAudio,
        sendMessage,
        clearMessages,
    };
}
