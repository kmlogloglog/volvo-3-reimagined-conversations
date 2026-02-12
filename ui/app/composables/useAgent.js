import { BUS } from '@/constants/bus.js';
import { useEventBus } from '@vueuse/core';
import { useAgentStore } from '@/stores/agent';

export function useAgent(options = {}) {
    const { onLevelChange } = options;

    const agentStore = useAgentStore();

    const connectionBus = useEventBus(BUS.AGENT_CONNECTION);
    const microphoneBus = useEventBus(BUS.MICROPHONE);

    // Starts audio recording with microphone access and event bus notifications
    async function startAudio() {
        try {
            microphoneBus.emit({ requesting: true, granted: false, denied: false });
            await agentStore.startAudio();

            // Restart level monitoring with callback if provided
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

    // Stops audio recording and notifies event bus
    function stopAudio() {
        agentStore.stopAudio();
        microphoneBus.emit({ requesting: false, granted: agentStore.micPermissionGranted, denied: false, ready: false });
        onLevelChange?.(0);
    }

    // Connects to the agent WebSocket with event bus integration
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

    // Disconnects from the agent WebSocket
    function disconnect() {
        agentStore.disconnect();
        connectionBus.emit({ connecting: false, connected: false });
    }

    // Sends a text message to the agent
    const sendMessage = (text) => agentStore.sendMessage(text);
    // Clears the conversation history
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
