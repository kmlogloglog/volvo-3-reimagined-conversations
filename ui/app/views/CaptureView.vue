<template>
    <div
        class="view">
        <div
            class="base-view">
            <div
                class="base-view-inner">
                <ChatPanel v-if="isChatActive" />
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
    import ChatPanel from '@/components/chat/ChatPanel.vue';
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

    watch([isConnected, isListening], ([newConnectedVal, newListeningVal], [oldConnectedVal]) => {
        if (oldConnectedVal){
            return;
        }

        if (newConnectedVal && newListeningVal || (newConnectedVal && isChatActive.value)) {
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
