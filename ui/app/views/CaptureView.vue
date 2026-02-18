<template>
    <div
        class="view">
        <BackgroundImagesCarousel
            :src="agentStore.backgroundImages" />
        <div
            class="base-view">
            <NuxtLoadingIndicator
                color="var(--color-white)" />
            <div
                v-show="!isLoading"
                class="base-view-inner">
            </div>
        </div>

        <NavigationBar
            v-model="activeNavItem"
            @[EMITS.RECORD_CLICK]="handleMicrophoneClick" />

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
    import { EMITS } from '@/constants/emits.js';
    import { useAgentStore } from '@/stores/agent';
    import BackgroundImagesCarousel from '@/components/backgroundImage/BackgroundImagesCarousel.vue';
    import AudioCaptureBlob from '@/components/animations/AudioCaptureBlob.vue';
    import AudioCaptureMeter from '@/components/animations/AudioCaptureMeter.vue';
    import FileUpload from '@/components/upload/FileUpload.vue';
    import { useAgent } from '@/composables/useAgent';

    const agentStore = useAgentStore();

    const activeNavItem = ref(null);

    const { isLoading } = useLoadingIndicator();

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
