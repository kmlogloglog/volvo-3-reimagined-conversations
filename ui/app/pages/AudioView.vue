<template>
    <div class="content-container"></div>
</template>

<script setup>
    import { useEventBus } from '@vueuse/core';
    import { useAgent } from '@/composables/useAgent';
    import { useAgentStore } from '@/stores/agent';

    const agentStore = useAgentStore();

    const agent = useAgent({
        onLevelChange: (newLevel) => {
            agentStore.audioLevel = newLevel;
        },
    });

    // --- Event bus (preserved) ---
    const bus = useEventBus('navigation');
    bus.on((payload) => {
        console.log(payload);

        if(payload.recording && !payload.paused) {
            agent.startAudio();

            return;
        }

        agent.stopAudio();
    });

    onUnmounted(() => {
        bus.off();

        agent.stopAudio();
    });

</script>

<style lang="scss" scoped>
    .content-container {
        align-items: center;
        display: flex;
        height: 100%;
        justify-content: center;
        overflow: hidden;
        width: 100%;

        .audio-waves {
            position: fixed;
            bottom: 0;
        }
    }
</style>
