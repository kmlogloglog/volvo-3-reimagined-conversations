<template>
    <div class="app-screen">
        <div class="base-view">
            <NuxtLoadingIndicator color="var(--color-white)" />
            <VolvoLogo color="var(--color-white)" class="logo" />
            <div v-show="!isLoading" class="base-view-inner">
                <slot></slot>
            </div>
        </div>

        <NavigationBar
            :is-page-loading="isLoading"
            @[EMITS.NAVIGATION_CHANGE]="onNavigate" />

        <!--
        Do not use AudioCaptureCircles together with full screen background image.
        AudioCaptureCircles breaks iOS Safari's background rendering behind browser chrome
        -->
        <ClientOnly>
            <AudioCaptureWaves
                v-if="route.name === NAVIGATION.AUDIO.name"
                class="audio-waves"
                :level="agentStore.audioLevel" />
            <AudioCaptureCircles />
        </ClientOnly>
    </div>
</template>

<script setup>
    import { EMITS } from '@/constants/emits.js';
    import { NAVIGATION } from '@/constants/navigation';
    import { navigateTo, useRoute } from '#app';
    import { useAgentStore } from '@/stores/agent';
    import VolvoLogo from '@/components/logo/VolvoLogo.vue';

    const emit = defineEmits([
        EMITS.NAVIGATION_CHANGE,
        EMITS.PHOTO_CAPTURED,
        EMITS.FILES_UPLOADED,
        EMITS.CLOSE,
    ]);

    const agentStore = useAgentStore();
    const route = useRoute();

    const { isLoading } = useLoadingIndicator();

    function onNavigate(name) {
        navigateTo(`/${name}`);
        emit(EMITS.NAVIGATION_CHANGE, name);
    }

</script>

<style scoped lang="scss">
.app-screen {
    align-items: center;
    bottom: 0;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    left: 0;
    padding-top: env(safe-area-inset-top, 0px);
    position: fixed;
    right: 0;
    top: 0;

    .logo {
        height: auto;
        left: 50%;
        position: absolute;
        top: calc(20px + env(safe-area-inset-top, 0px));
        transform: translateX(-50%);
        width: 110px;
    }

    .base-view {
        flex: 1;
        margin: 0 auto;
        overflow-y: auto;
        position: relative;
        width: 100%;
        z-index: 10;
        -webkit-overflow-scrolling: touch;

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
