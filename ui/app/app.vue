<template>
    <div id="app" class="j" :style="backgroundStyle">
        <AppLayout
            :show-waves="$route.name === NAVIGATION.AUDIO.name"
            :show-circles="!agentStore.backgroundImageUrl">
            <NuxtPage />
        </AppLayout>
    </div>
</template>

<script setup>
    import { preloadRouteComponents } from '#app';
    import { NAVIGATION } from '@/constants/navigation.js';
    import AppLayout from '@/appLayouts/AppLayout.vue';
    import { useAgentStore } from '@/stores/agent';

    preloadRouteComponents('/');
    preloadRouteComponents('/ChatView');
    preloadRouteComponents('/AudioView');
    preloadRouteComponents('/PhotoView');
    preloadRouteComponents('/UploadView');

    const agentStore = useAgentStore();
    const { backgroundStyle } = useBackground(agentStore);

    // agentStore.backgroundImageUrl = './assets/images/backgrounds/placeholder-volvo-ex60-front.jpg';
</script>

<style scoped lang="scss">
#app {
    min-height: calc(150vh + 1px);
}
</style>
