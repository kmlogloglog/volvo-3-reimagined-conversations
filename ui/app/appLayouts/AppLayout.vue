<template>
    <div class="app-screen">
        <div class="base-view">
            <VolvoLogo :color="'#ffffff'" class="logo" />
            <div class="base-view-inner">
                <slot></slot>
            </div>
        </div>
        <NavigationBar
            @[EMITS.NAVIGATION_CHANGE]="onNavigate" />
        <AudioCaptureWaves v-if="showWaves" />
        <!--
        Do not use AudioCaptureCircles together with full screen background image.
        AudioCaptureCircles breaks iOS Safari's background rendering behind browser chrome
        -->
        <AudioCaptureCircles v-if="showCircles" />
    </div>
</template>

<script setup>
    import { EMITS } from '@/constants/emits.js';
    import { navigateTo } from '#app';
    import VolvoLogo from '~/components/logo/VolvoLogo.vue';

    defineProps({
        showWaves: {
            type: Boolean,
            default: false,
        },
        showCircles: {
            type: Boolean,
            default: true,
        },
    });

    const emit = defineEmits([EMITS.NAVIGATION_CHANGE]);

    function onNavigate(navigationName) {
        navigateTo(`/${navigationName}`);
        emit(EMITS.NAVIGATION_CHANGE, navigationName);
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
