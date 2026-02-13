<template>
    <div
        class="view">
        <BackgroundImagesCarousel
            :src="agentStore.backgroundImages" />
        <div
            class="base-view"
            :class="{ 'full-height': isFullHeightPage }">
            <NuxtLoadingIndicator
                color="var(--color-white)" />
            <div
                v-show="!isLoading"
                class="base-view-inner">
                <slot></slot>
            </div>
        </div>

        <NavigationBar
            @[EMITS.NAVIGATION_CHANGE]="onNavigate" />

        <!--
        Do not use AudioCaptureCircles together with full screen background image.
        AudioCaptureCircles breaks iOS Safari's background rendering behind browser chrome
        -->
        <AudioCaptureWaves
            v-if="route.name === ROUTE.AUDIO.name"
            class="audio-waves"
            :level="agentStore.audioLevel" />
        <AudioCaptureCircles
            :enabled="!agentStore.backgroundImages" />
    </div>
</template>

<script setup>
    import { EMITS } from '@/constants/emits.js';
    import { ROUTE } from '@/constants/route';
    import { navigateTo, useRoute } from '#app';
    import { useAgentStore } from '@/stores/agent';
    import BackgroundImagesCarousel from '@/components/backgroundImage/BackgroundImagesCarousel.vue';
    import AudioCaptureCircles from '@/components/animations/AudioCaptureCircles.vue';
    import AudioCaptureWaves from '@/components/animations/AudioCaptureWaves.vue';

    const agentStore = useAgentStore();
    const route = useRoute();

    const { isLoading } = useLoadingIndicator();

    function onNavigate(name) {
        const ignoreRouteNames = [ROUTE.CAMERA.name, ROUTE.UPLOAD.name];

        if (ignoreRouteNames.includes(name)) {
            return;
        }

        navigateTo(`/${name}`);
    }

    const isFullHeightPage = computed(() => {
        return [ROUTE.CAMERA.name, 'index'].includes(route.name);
    });

</script>

<style scoped lang="scss">
.view {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    justify-content: flex-end;
    padding-top: env(safe-area-inset-top, 0px);
    position: fixed;
    row-gap: 1.25rem;
    width: 100%;

    .base-view {
        margin: 0 auto;
        overflow-y: auto;
        position: relative;
        width: 100%;
        z-index: 10;
        overflow: hidden;
        -webkit-overflow-scrolling: touch;

        &.full-height {
            flex: 1;
        }

        &-inner {
            height: 100%;
            margin: 0 auto;
            max-width: var(--max-width);
            position: relative;
            z-index: 10;
        }
    }
}
</style>
