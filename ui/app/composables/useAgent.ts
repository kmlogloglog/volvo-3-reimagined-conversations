import { BUS } from '@/constants/bus';
import { useEventBus } from '@vueuse/core';
import { useAgentStore } from '@/stores/agent';
import { storeToRefs } from 'pinia';
import type { ConnectParams } from '@/types/agent';

interface UseAgentOptions {
    onLevelChange?: (level: number) => void;
}

export function useAgent(options: UseAgentOptions = {}) {
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
    async function startAudio(): Promise<void> {
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
        } catch (error: unknown) {
            microphoneBus.emit({ requesting: false, granted: false, denied: true, error: error instanceof Error ? error.message : String(error), ready: false });
            throw error;
        }
    }

    function stopAudio(): void {
        agentStore.stopAudio();
        microphoneBus.emit({ requesting: false, ready: false });
        onLevelChange?.(0);
    }

    async function connect(params: ConnectParams = {}): Promise<void> {
        await agentStore.connect(params);
    }

    function disconnect(): void {
        agentStore.disconnect();
    }

    const sendMessage = (text: string): void => agentStore.sendMessage(text);
    const clearMessages = (): void => agentStore.clearMessages();

    return {
        connect,
        disconnect,
        startAudio,
        stopAudio,
        sendMessage,
        clearMessages,
    };
}
