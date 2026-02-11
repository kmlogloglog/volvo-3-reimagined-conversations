<template>
    <div class="content-container"></div>
</template>

<script setup>
    import { useEventBus } from '@vueuse/core';
    import { useAgent } from '@/composables/useAgent';
    import { BUS } from '@/constants/bus.js';

    const agent = useAgent();

    const busRecord = useEventBus(BUS.TOGGLE_RECORD);

    busRecord.on((recording) => {
        if (recording) {
            agent.startAudio();

            return;
        }

        agent.stopAudio();
    });

    onUnmounted(() => {
        busRecord.off();

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
