import { BUS } from '@/constants/bus.js';
import { useEventBus } from '@vueuse/core';
import { useAgentStore } from '@/stores/agent';
import { storeToRefs } from 'pinia';

export function useAgent(options = {}) {
    const { onLevelChange } = options;

    const agentStore = useAgentStore();
    const { listening } = storeToRefs(agentStore);

    const microphoneBus = useEventBus(BUS.MICROPHONE);
    const listeningBus = useEventBus(BUS.LISTENING);

    // Bridge Pinia listening state to the event bus so components without
    // direct store access can react to microphone activation changes.
    watch(listening, (value) => {
        listeningBus.emit({ listening: value });
    });

    // Re-registers the level monitoring callback after audio starts so the
    // caller's onLevelChange handler is always wired to the current analyser nodes.
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

    async function connect(params = {}) {
        await agentStore.connect(params);
    }

    function disconnect() {
        agentStore.disconnect();
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
