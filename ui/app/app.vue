<template>
    <div id="app" :style="backgroundStyle">
        <CaptureView/>
    </div>
</template>

<script setup>
    import CaptureView from '@/views/CaptureView.vue';
    import { useAgentStore } from '@/stores/agent';
    import { useBackground } from '@/composables/useBackground';
    import { AGENT } from '@/constants/agent.js';

    const agentStore = useAgentStore();
    const { backgroundStyle } = useBackground(agentStore);

    onMounted(() => {
        agentStore.set_userName(`${AGENT.DEFAULT_USER_NAME}_${crypto.randomUUID()}`);
    });
</script>

<style scoped lang="scss">
#app {
    min-height: calc(150vh + 1px);
}
</style>
