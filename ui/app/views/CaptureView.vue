<template>
    <div
        class="view">
        <BackgroundImages
            :src="agentStore.backgroundImages" />
        <div
            class="base-view">
            <div
                class="base-view-inner">
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

        <AudioCaptureMeter
            :level="agentStore.audioLevel" />
        <AudioCaptureBlob
            :intensity="agentStore.audioLevel" />
    </div>
</template>

<script setup>
    import { BUS } from '@/constants/bus.js';
    import { EMITS } from '@/constants/emits.js';
    import { AGENT } from '@/constants/agent.js';
    import { storeToRefs } from 'pinia';
    import { useAgent } from '@/composables/useAgent';
    import { useAgentStore } from '@/stores/agent';
    import { useEventBus } from '@vueuse/core';
    import AudioCaptureBlob from '@/components/animations/AudioCaptureBlob.vue';
    import AudioCaptureMeter from '@/components/animations/AudioCaptureMeter.vue';
    import BackgroundImages from '@/components/imageViewer/BackgroundImages.vue';
    import ChatPanel from '@/components/chat/ChatPanel.vue';
    import DealerDetailsCard from '@/components/dealerDetailsCard/DealerDetailsCard.vue';
    import FileUpload from '@/components/upload/FileUpload.vue';

    const agentStore = useAgentStore();

    function handleFileUploaded(files) {
        console.log('Files uploaded:', files);
    }

    function handleUploadError(error) {
        console.error('File upload error:', error);
    }

    const agent = useAgent();

    function handleMicrophoneClick(enabled) {
        if (enabled) {
            agent.startAudio();

            return;
        }

        agent.stopAudio();
    }

    const busConnection = useEventBus(BUS.AGENT_CONNECTION);

    const isConnected = ref(false);

    busConnection.on(async (payload) => {
        isConnected.value = !payload.connecting && payload.connected;
    });

    const { listening: isListening } = storeToRefs(agentStore);
    // Watch specifically for audio listening starting
    watch(isListening, (newVal) => {
        if (newVal && !isChatActive.value) {
            agent.sendMessage(AGENT.INTRODUCTION);
        }
    });

    // Watch specifically for connection in chat mode
    watch(isConnected, (newVal) => {
        if (newVal && isChatActive.value) {
            agent.sendMessage(AGENT.INTRODUCTION);
        }
    });

    const isChatActive = ref(false);

    function handleChatClick(enabled) {
        isChatActive.value = enabled;
    }
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
        padding: 0 1.875rem;
        flex: 1;
        align-content: center;

        &.full-height {
            flex: 1;
        }

        &-inner {
            height: 100%;
            margin: 0 auto;
            max-width: var(--max-width);
            position: relative;
            z-index: 10;
            //
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
    }
}
</style>
