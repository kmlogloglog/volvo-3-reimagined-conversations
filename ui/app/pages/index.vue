<template>
    <div class="view">
        <ClientOnly>
            <DebugCopyButton />
        </ClientOnly>
        <Transition name="bg-single">
            <BackgroundImageSilhouette
                v-if="isModelComponent"
                :src="agentStore.backgroundImages?.[0]"
                @image-loaded="onImageLoaded" />
        </Transition>

        <Transition name="bg-carousel">
            <BackgroundImages
                v-if="isCarouselVisible"
                :src="carouselSrc" />
        </Transition>

        <VolvoLogo
            color="var(--color-white)"
            drop-shadow="var(--color-black)"
            class="view-logo" />

        <div class="base-view">
            <div class="base-view-inner">
                <DealerDetailsCard
                    v-if="agentStore.testDriveDetails"
                    v-bind="agentStore.testDriveDetails" />
                <ChatPanel v-else-if="isChatActive" />
            </div>
        </div>

        <NavigationBar
            @[EMITS.RECORD_CLICK]="handleMicrophoneClick"
            @[EMITS.CHAT_CLICK]="handleChatClick" />

        <AudioCaptureBlob
            :intensity="agentStore.audioLevel"
            :scale="blobScale"
            :calmness="blobCalmness"
            :bottom-align="isCarouselVisible"
            :gradient-stops="blobGradientStops"
            :hide="isBlobMaskComponent" />

        <BlobMask
            class="blob-mask-component"
            :class="{ 'blob-mask-component-visible': isBlobMaskComponent }"
            :visible="isBlobMaskComponent"
            :image-src="agentStore.backgroundImages?.[0]"
            :image-scale="agentStore.componentName === AGENT.COMPONENT_NAME.INTERIOR ? 1.1 : 1" />

        <Transition name="fade">
            <AudioListeningMessage
                v-if="isListening" />
        </Transition>

        <ClientOnly>
            <div v-if="isMobile" class="view-bottom-scrim"></div>
        </ClientOnly>
    </div>
</template>

<script setup lang="ts">
    import type { ConnectionBusPayload } from '@/types/bus';
    import { BUS } from '@/constants/bus';
    import { EMITS } from '@/constants/emits';
    import { AGENT } from '@/constants/agent';
    import { storeToRefs } from 'pinia';
    import { useAgent } from '@/composables/useAgent';
    import { useAgentStore } from '@/stores/agent';
    import { useEventBus } from '@vueuse/core';
    import AudioCaptureBlob from '@/components/audioCapture/AudioCaptureBlob.vue';
    import BlobMask from '@/components/blobMask/BlobMask.vue';

    import BackgroundImages from '@/components/imageViewer/BackgroundImages.vue';
    import BackgroundImageSilhouette from '@/components/imageViewer/BackgroundImageSilhouette.vue';
    import AudioListeningMessage from '@/components/audioCapture/AudioListeningMessage.vue';
    import ChatPanel from '@/components/chat/ChatPanel.vue';
    import DealerDetailsCard from '@/components/dealerDetailsCard/DealerDetailsCard.vue';
    import DebugCopyButton from '@/components/debug/DebugCopyButton.vue';
    import VolvoLogo from '@/components/logo/VolvoLogo.vue';

    const agentStore = useAgentStore();
    const agent = useAgent();
    const route = useRoute();
    const { isMobile } = useDevice();

    const { listening: isListening } = storeToRefs(agentStore);

    // Components that use the multi-image carousel background.
    const CAROUSEL_COMPONENTS = [
        AGENT.COMPONENT_NAME.FINAL_CONFIGURATION,
        AGENT.COMPONENT_NAME.MAPS_VIEW,
        AGENT.COMPONENT_NAME.TEST_DRIVE_CONFIRMATION,
    ];

    // Components that use the blob mask spotlight reveal.
    const BLOB_MASK_COMPONENTS = [
        AGENT.COMPONENT_NAME.WHEELS,
        AGENT.COMPONENT_NAME.INTERIOR,
    ];

    const isModelComponent = computed(() => agentStore.componentName === AGENT.COMPONENT_NAME.MODEL);
    const isCarouselVisible = computed(() => CAROUSEL_COMPONENTS.includes(agentStore.componentName as string));
    const isBlobMaskComponent = computed(() => BLOB_MASK_COMPONENTS.includes(agentStore.componentName as string));

    // Frozen carousel images — only updated while the carousel is actually visible.
    // Prevents a mid-leave src change from triggering an internal crossfade inside
    // BackgroundImages that fights the outer leave transition.
    const carouselSrc = ref<string[] | undefined>(undefined);
    watch(
        [isCarouselVisible, () => agentStore.backgroundImages],
        ([visible, images]) => {
            if (visible) {
                carouselSrc.value = (images as string[]) ?? undefined;
            }
        },
        { immediate: true },
    );

    // Reset only when the component step changes so that image src updates within
    // the same step don't collapse and re-expand the blob scale.
    const imageReady = ref(false);

    watch(() => agentStore.componentName, () => {
        imageReady.value = false;
    });

    function onImageLoaded() {
        imageReady.value = true;
    }

    const blobScale = computed(() =>
        isModelComponent.value && imageReady.value ? 3 : 1,
    );

    const blobCalmness = computed(() =>
        isModelComponent.value && imageReady.value ? 0.5 : 0,
    );

    const blobGradientStops = computed(() =>
        agentStore.componentName === AGENT.COMPONENT_NAME.EXTERIOR && agentStore.gradientStops
            ? agentStore.gradientStops
            : undefined,
    );

    // Tracks which mode ('audio' | 'chat') triggered the intro, to prevent duplicates.
    const introSentBy = ref<'audio' | 'chat' | null>(null);

    function sendIntro(mode: 'audio' | 'chat') {
        agent.sendMessage(AGENT.INTRODUCTION);
        introSentBy.value = mode;
    }

    const busConnection = useEventBus<ConnectionBusPayload>(BUS.AGENT_CONNECTION);
    const isConnected = ref(false);

    busConnection.on((payload) => {
        isConnected.value = !payload.connecting && !!payload.connected;
    });

    watch(isConnected, (newVal) => {
        if (!newVal) {
            introSentBy.value = null;
            return;
        }

        if (isChatActive.value && !isListening.value && introSentBy.value !== 'chat') {
            sendIntro('chat');
        }
    });

    watch(isListening, (newVal) => {
        if (newVal && !isChatActive.value) {
            sendIntro('audio');
        }
    });

    function handleMicrophoneClick(enabled: boolean) {
        if (enabled) {
            agent.startAudio();
            return;
        }

        agent.stopAudio();
        if (introSentBy.value === 'audio') {
            introSentBy.value = null;
        }
    }

    const isChatActive = ref(false);

    function handleChatClick(enabled: boolean) {
        isChatActive.value = enabled;

        if (!enabled) {
            if (introSentBy.value === 'chat') {
                introSentBy.value = null;
            }
            return;
        }

        if (isConnected.value && !isListening.value) {
            sendIntro('chat');
        }
    }

    onMounted(() => {
        agentStore.connect({ userId: route.query.user as string | undefined, sessionId: route.query.session as string | undefined });
    });
</script>

<style scoped lang="scss">
.view {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    justify-content: flex-end;
    left: 0;
    margin-inline: auto;
    max-width: var(--max-width);
    padding-top: env(safe-area-inset-top, 0px);
    position: fixed;
    right: 0;
    row-gap: 1.25rem;
    top: 0;
    width: 100%;

    .view-logo {
        height: auto;
        left: 50%;
        position: fixed;
        top: calc(20px + env(safe-area-inset-top, 0px));
        transform: translateX(-50%);
        width: 110px;
        z-index: 15;
    }

    .base-view {
        -webkit-overflow-scrolling: touch;
        align-content: center;
        flex: 1;
        margin: 0 auto;
        overflow-y: auto;
        overflow: hidden;
        position: relative;
        width: 100%;
        z-index: 20;

        &.full-height {
            flex: 1;
        }

        &-inner {
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
            width: 100%;
            z-index: 10;
        }
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.bg-single-leave-active {
    transition: opacity 1s ease, filter 1s ease;
}

.bg-single-leave-from {
    filter: blur(0px);
    opacity: 1;
}

.bg-single-leave-to {
    filter: blur(16px);
    opacity: 0;
}

.bg-carousel-enter-active,
.bg-carousel-leave-active {
    transition: opacity 1s ease;
}

.bg-carousel-enter-from,
.bg-carousel-leave-to {
    opacity: 0;
}

// Eased scrim gradient covering the gap behind the iOS Safari toolbar.
// Cubic-bezier-inspired opacity stops for a smooth perceptual fade.
.view-bottom-scrim {
    bottom: 0;
    height: 10vh;
    left: 0;
    pointer-events: none;
    position: fixed;
    width: 100%;
    z-index: 10;
    background: linear-gradient(
        to bottom,
        transparent 0%,
        color-mix(in srgb, var(--app-background-color) 0.2%, transparent) 1.8%,
        color-mix(in srgb, var(--app-background-color) 0.8%, transparent) 4.8%,
        color-mix(in srgb, var(--app-background-color) 2.1%, transparent) 9%,
        color-mix(in srgb, var(--app-background-color) 4.2%, transparent) 13.9%,
        color-mix(in srgb, var(--app-background-color) 7.5%, transparent) 19.8%,
        color-mix(in srgb, var(--app-background-color) 12.6%, transparent) 27%,
        color-mix(in srgb, var(--app-background-color) 19.4%, transparent) 35%,
        color-mix(in srgb, var(--app-background-color) 27.8%, transparent) 43.5%,
        color-mix(in srgb, var(--app-background-color) 38.2%, transparent) 52.6%,
        color-mix(in srgb, var(--app-background-color) 54.1%, transparent) 65%,
        color-mix(in srgb, var(--app-background-color) 73.8%, transparent) 80.2%,
        color-mix(in srgb, var(--app-background-color) 100%, transparent) 100%
    );
}

.blob-mask-component {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.8s ease;

    &-visible {
        opacity: 1;
        pointer-events: auto;
    }
}
</style>
