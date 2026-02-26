<template>
    <div id="app">
        <CaptureView/>
    </div>
</template>

<script setup>
    import CaptureView from '@/views/CaptureView.vue';
    import { useAgentStore } from '@/stores/agent';
    import { AGENT } from '@/constants/agent.js';

    const agentStore = useAgentStore();

    onBeforeMount(() => {
        agentStore.set_userName(`${AGENT.DEFAULT_USER_NAME}_${crypto.randomUUID()}`);
    });

</script>

<style scoped lang="scss">
#app {
    min-height: calc(150vh + 1px);
    background-color: var(--app-background-color);

}
</style>
