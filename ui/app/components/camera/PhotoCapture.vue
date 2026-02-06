<template>
    <div v-if="isOpen" class="camera-content">
        <div class="camera-header">
            <h3>Take Photo</h3>
            <button class="close-button" @click="closeCamera">✕</button>
        </div>

        <div class="camera-view">
            <video
                ref="videoElement"
                autoplay
                playsinline
                muted
                class="camera-video"
                :class="{ 'camera-video-error': cameraState.hasError }" ></video>
            <canvas
                ref="canvasElement"
                class="camera-canvas"
                style="display: none;"></canvas>

            <div v-if="cameraState.hasError" class="camera-error">
                <p>{{ cameraState.errorMessage }}</p>
                <div class="retry-button-wrapper">
                    <BaseButton label="Try Again" @click="requestCameraAccess" />
                </div>
            </div>

            <div v-if="cameraState.isLoading" class="camera-loading">
                <p>Loading camera...</p>
            </div>
        </div>

        <div class="camera-controls">
            <div class="capture-button-wrapper">
                <BaseButton
                    :label="'Capture'"
                    :disabled="cameraState.hasError || cameraState.isLoading"
                    @click="takePhoto" />
            </div>
        </div>
    </div>
</template>

<script setup>
    import BaseButton from '@/components/baseComponents/uiElements/BaseButton.vue';
    import { EMITS } from '@/constants/emits';

    const props = defineProps({
        isOpen: {
            type: Boolean,
            default: false,
        },
    });

    const emit = defineEmits([EMITS.CLOSE, EMITS.PHOTO_CAPTURED]);

    // Refs
    const videoElement = ref(null);
    const canvasElement = ref(null);

    // Camera state management
    const cameraState = reactive({
        isLoading: false,
        hasError: false,
        errorMessage: '',
        stream: null,
    });

    // Watch for when modal opens to start camera
    watch(() => props.isOpen, async (newValue) => {
        if (newValue) {
            await requestCameraAccess();
        } else {
            stopCameraStream();
        }
    });

    async function requestCameraAccess() {
        cameraState.isLoading = true;
        cameraState.hasError = false;
        cameraState.errorMessage = '';

        try {
            // Try mobile-optimized constraints first (back camera with high resolution)
            let constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
            };

            console.log('Requesting camera with mobile-first constraints:', constraints);

            try {
                // Try with mobile-optimized constraints first
                cameraState.stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                // If mobile constraints fail, fallback to desktop/basic constraints
                if (error.name === 'OverconstrainedError' || error.name === 'NotFoundError') {
                    console.log('Fallback: trying with desktop/basic constraints');
                    constraints = {
                        video: {
                            width: { ideal: 1920 },
                            height: { ideal: 1080 },
                        },
                    };

                    try {
                        cameraState.stream = await navigator.mediaDevices.getUserMedia(constraints);
                    } catch {
                        // Final fallback to minimal constraints
                        console.log('Final fallback: trying with minimal constraints');
                        constraints = {
                            video: {
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                            },
                        };
                        cameraState.stream = await navigator.mediaDevices.getUserMedia(constraints);
                    }
                } else {
                    throw error;
                }
            }

            // Set up video element
            if (videoElement.value) {
                videoElement.value.srcObject = cameraState.stream;
            }

            cameraState.isLoading = false;
            console.log('Camera access successful');
        } catch (error) {
            cameraState.hasError = true;
            cameraState.isLoading = false;

            if (error.name === 'NotAllowedError') {
                cameraState.errorMessage = 'Camera access denied. Please allow camera permissions.';
            } else if (error.name === 'NotFoundError') {
                cameraState.errorMessage = 'No camera found on this device.';
            } else if (error.name === 'OverconstrainedError') {
                cameraState.errorMessage = 'Camera resolution not supported. Please try again.';
            } else {
                cameraState.errorMessage = 'Failed to access camera. Please try again.';
            }

            console.error('Camera access error:', error);
        }
    }

    function takePhoto() {
        if (!videoElement.value || !canvasElement.value) return;

        const video = videoElement.value;
        const canvas = canvasElement.value;
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                const photoData = {
                    file,
                    url: URL.createObjectURL(blob),
                    timestamp: Date.now(),
                    name: file.name,
                };

                // Emit the captured photo
                emit(EMITS.PHOTO_CAPTURED, photoData);

                // Close camera
                closeCamera();
            }
        }, 'image/jpeg', 0.9);
    }

    function stopCameraStream() {
        if (cameraState.stream) {
            cameraState.stream.getTracks().forEach(track => track.stop());
            cameraState.stream = null;
        }
    }

    function closeCamera() {
        stopCameraStream();

        // Reset camera state
        cameraState.isLoading = false;
        cameraState.hasError = false;
        cameraState.errorMessage = '';

        // Emit close event
        emit(EMITS.CLOSE);
    }

    // Cleanup on unmount
    onUnmounted(() => {
        stopCameraStream();
    });
</script>

<style scoped lang="scss">
.camera-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    background-color: var(--speech-bubble-color-background);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    width: min(95vw, 600px);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.camera-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
        color: var(--font-color-primary);
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
    }
}

.close-button {
    background: var(--button-color-background);
    border: none;
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--button-color-font);
    transition: all 0.2s ease;

    &:hover {
        transform: scale(1.05);
        opacity: 0.9;
    }

    &:active {
        transform: scale(0.95);
    }
}

.camera-view {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background-color: var(--color-black);
    border-radius: var(--border-radius);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
}

.camera-video {
    width: 100%;
    height: 100%;
    object-fit: cover;

    &.camera-video-error {
        display: none;
    }
}

.camera-canvas {
    position: absolute;
    top: 0;
    left: 0;
}

.camera-error, .camera-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--color-white);

    p {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 500;
    }
}

.retry-button-wrapper {
    max-width: 200px;
    margin: 0 auto;

    :deep(button) {
        background-color: var(--button-color-background) !important;
        color: var(--button-color-font) !important;
        font-weight: 600;

        &:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        &:active {
            transform: translateY(0);
        }
    }
}

.camera-controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.capture-button-wrapper {
    min-width: 140px;
    margin: 0 auto;

    :deep(button) {
        background-color: var(--button-color-background) !important;
        color: var(--button-color-font) !important;
        font-weight: 600;
        height: 3rem;

        &:hover:not(:disabled) {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        &:active:not(:disabled) {
            transform: translateY(0);
        }

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
    }
}
</style>
