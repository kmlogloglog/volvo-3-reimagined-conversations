<template>
    <div class="view">
        <BackgroundImages
            :src="agentStore.backgroundImages" />
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

        <!-- Hidden file upload component -->
        <FileUpload
            ref="fileUploadRef"
            @[EMITS.FILE_UPLOADED]="handleFileUploaded"
            @[EMITS.UPLOAD_ERROR]="handleUploadError" />

        <ClientOnly>
            <AudioCaptureMeter
                v-if="$router.currentRoute.value.query.meter === 'true'"
                :level="agentStore.audioLevel" />
        </ClientOnly>

        <AudioCaptureBlob
            :intensity="agentStore.audioLevel"
            :bottom-align="agentStore.backgroundImages?.length > 0"
            :gradient-stops="demoBlobGradientStops" />

        <Transition name="fade">
            <AudioListeningMessage
                v-if="isListening" />
        </Transition>
    </div>
</template>

<script setup>
    import { BUS } from '@/constants/bus.js';
    import { EMITS } from '@/constants/emits.js';
    import { AGENT } from '@/constants/agent.js';
    import { storeToRefs } from 'pinia';
    import { useAgent } from '@/composables/useAgent';
    import { useAgentStore } from '@/stores/agent';
    import { useEventBus, useIntervalFn } from '@vueuse/core';
    import AudioCaptureBlob from '@/components/audioCapture/AudioCaptureBlob.vue';
    import AudioCaptureMeter from '@/components/audioCapture/AudioCaptureMeter.vue';
    import BackgroundImages from '@/components/imageViewer/BackgroundImages.vue';
    import AudioListeningMessage from '@/components/audioCapture/AudioListeningMessage.vue';
    import ChatPanel from '@/components/chat/ChatPanel.vue';
    import DealerDetailsCard from '@/components/dealerDetailsCard/DealerDetailsCard.vue';
    import FileUpload from '@/components/upload/FileUpload.vue';

    const agentStore = useAgentStore();
    const agent = useAgent();

    const introSentBy = ref(null); // 'audio' | 'chat' | null

    function sendIntro(mode) {
        agent.sendMessage(AGENT.INTRODUCTION);
        introSentBy.value = mode;
    }

    // File upload
    function handleFileUploaded(files) {
        console.log('Files uploaded:', files);
    }

    function handleUploadError(error) {
        console.error('File upload error:', error);
    }

    // Connection
    const busConnection = useEventBus(BUS.AGENT_CONNECTION);
    const isConnected = ref(false);

    busConnection.on((payload) => {
        isConnected.value = !payload.connecting && payload.connected;
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

    // Audio
    const { listening: isListening } = storeToRefs(agentStore);

    watch(isListening, (newVal) => {
        if (newVal && !isChatActive.value) {
            sendIntro('audio');
        }
    });

    function handleMicrophoneClick(enabled) {
        if (enabled) {
            agent.startAudio();
            return;
        }

        agent.stopAudio();
        if (introSentBy.value === 'audio') {
            introSentBy.value = null;
        }
    }

    // Chat
    const isChatActive = ref(false);

    function handleChatClick(enabled) {
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
        agentStore.connect();
    });

    // ============================================================
    // DEMO ONLY: Cycling blob gradient stops every 5 seconds
    // ============================================================
    const DEMO_GRADIENT_CYCLES = [
        [
            { position: 0, r: 250, g: 210, b: 200, a: 0.75 },
            { position: 1, r: 89, g: 41, b: 12, a: 0.15 },
        ],
        [
            { position: 0, r: 120, g: 180, b: 255, a: 0.75 },
            { position: 1, r: 20, g: 60, b: 180, a: 0.15 },
        ],
        [
            { position: 0, r: 180, g: 255, b: 200, a: 0.75 },
            { position: 1, r: 20, g: 120, b: 60, a: 0.15 },
        ],
        [
            { position: 0, r: 255, g: 220, b: 100, a: 0.75 },
            { position: 1, r: 160, g: 80, b: 10, a: 0.15 },
        ],
        [
            { position: 0, r: 220, g: 140, b: 255, a: 0.75 },
            { position: 1, r: 80, g: 20, b: 160, a: 0.15 },
        ],
    ];
    const demoBlobGradientIndex = ref(0);
    const demoBlobGradientStops = computed(() => DEMO_GRADIENT_CYCLES[demoBlobGradientIndex.value]);
    useIntervalFn(() => {
        demoBlobGradientIndex.value = (demoBlobGradientIndex.value + 1) % DEMO_GRADIENT_CYCLES.length;
    }, 5000);
    // ============================================================
    // END DEMO
    // ============================================================
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
        z-index: 10;

        &.full-height {
            flex: 1;
        }

        &-inner {
            height: 100%;
            margin: 0 auto;
            max-width: var(--max-width);
            position: relative;
            z-index: 10;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
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
</style>
