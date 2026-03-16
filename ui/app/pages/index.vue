<template>
    <div class="view">
        <Transition name="bg-single">
            <div v-if="isModelComponent" class="image-stage-wrapper">
                <BackgroundImageSingle
                    :src="agentStore.backgroundImages?.[0]"
                    @image-loaded="onImageLoaded" />
            </div>
        </Transition>

        <BackgroundImages
            v-if="isCarouselVisible"
            :src="agentStore.backgroundImages ?? undefined" />

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

        <ClientOnly>
            <AudioCaptureMeter
                v-if="$router.currentRoute.value.query.meter === 'true'"
                :level="agentStore.audioLevel" />
        </ClientOnly>

        <AudioCaptureBlob
            :intensity="agentStore.audioLevel"
            :scale="blobScale"
            :vertical-offset="blobVerticalOffset"
            :bottom-align="isCarouselVisible"
            :gradient-stops="blobGradientStops"
            :hide="isBlobMaskComponent" />

        <BlobMask
            v-if="isBlobMaskComponent"
            :image-src="agentStore.backgroundImages?.[0]"
            :image-scale="agentStore.componentName === AGENT.COMPONENT_NAME.INTERIOR ? 1.1 : 1" />

        <Transition name="fade">
            <AudioListeningMessage
                v-if="isListening" />
        </Transition>
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
    import AudioCaptureMeter from '@/components/audioCapture/AudioCaptureMeter.vue';
    import BackgroundImages from '@/components/imageViewer/BackgroundImages.vue';
    import BackgroundImageSingle from '@/components/imageViewer/BackgroundImageSingle.vue';
    import AudioListeningMessage from '@/components/audioCapture/AudioListeningMessage.vue';
    import ChatPanel from '@/components/chat/ChatPanel.vue';
    import DealerDetailsCard from '@/components/dealerDetailsCard/DealerDetailsCard.vue';

    const agentStore = useAgentStore();
    const agent = useAgent();
    const route = useRoute();

    const { listening: isListening } = storeToRefs(agentStore);

    // Layout & background

    const CAROUSEL_COMPONENTS = [
        AGENT.COMPONENT_NAME.FINAL_CONFIGURATION,
        AGENT.COMPONENT_NAME.MAPS_VIEW,
        AGENT.COMPONENT_NAME.TEST_DRIVE_CONFIRMATION,
    ];

    const BLOB_MASK_COMPONENTS = [
        AGENT.COMPONENT_NAME.WHEELS,
        AGENT.COMPONENT_NAME.INTERIOR,
    ];

    const isModelComponent = computed(() => agentStore.componentName === AGENT.COMPONENT_NAME.MODEL);
    const isCarouselVisible = computed(() => CAROUSEL_COMPONENTS.includes(agentStore.componentName as string));
    const isBlobMaskComponent = computed(() => BLOB_MASK_COMPONENTS.includes(agentStore.componentName as string));

    // Blob shape & appearance

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
        isModelComponent.value && imageReady.value ? 2.5 : 1,
    );

    const blobVerticalOffset = computed(() =>
        isModelComponent.value && imageReady.value ? '-15%' : '0%',
    );

    const blobGradientStops = computed(() =>
        agentStore.componentName === AGENT.COMPONENT_NAME.EXTERIOR && agentStore.gradientStops
            ? agentStore.gradientStops
            : undefined,
    );

    // Connection & intro

    // Tracks which mode triggered the intro message: 'audio', 'chat', or null.
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

    // User interactions

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

    // Toggles the chat panel and sends the intro message on open, guarding against duplicate intros.
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
    padding-top: env(safe-area-inset-top, 0px);
    position: fixed;
    row-gap: 1.25rem;
    width: 100%;

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
            margin: 0 auto;
            max-width: var(--max-width);
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

// Leave-only — entry is handled by BackgroundImageSingle's internal load-driven fade.
.bg-single-leave-active {
    filter: blur(0px);
    opacity: 1;
    transition: opacity 1s ease, filter 1s ease;
}

.bg-single-leave-to {
    filter: blur(16px);
    opacity: 0;
}
</style>
