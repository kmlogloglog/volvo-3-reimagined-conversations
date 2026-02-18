<template>
    <div id="app" :style="backgroundStyle">
        <CaptureView/>
    </div>
</template>

<script setup>
    import { preloadRouteComponents } from '#app';
    import CaptureView from '@/views/CaptureView.vue';
    import { useAgentStore } from '@/stores/agent';

    preloadRouteComponents('/');
    preloadRouteComponents('/ChatView');
    preloadRouteComponents('/AudioView');
    preloadRouteComponents('/PhotoView');

    const agentStore = useAgentStore();
    const { backgroundStyle } = useBackground(agentStore);
</script>

<style scoped lang="scss">
#app {
    min-height: calc(150vh + 1px);
}
</style>
