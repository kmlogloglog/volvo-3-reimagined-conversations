<template>
    <div id="app" :style="backgroundStyle">
        <CaptureView
            :show-waves="$route.name === NAVIGATION.AUDIO.name"
            :show-circles="!agentStore.backgroundImages">
            <NuxtPage />
        </CaptureView>
    </div>
</template>

<script setup>
    import { preloadRouteComponents } from '#app';
    import { NAVIGATION } from '@/constants/navigation';
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
