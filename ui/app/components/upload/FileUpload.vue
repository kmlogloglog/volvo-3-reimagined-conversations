<template>
    <!-- Hidden file input for upload functionality -->
    <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*,.pdf,.txt"
        class="hidden-file-input"
        @change="onFileSelected" />

    <!-- Upload progress modal -->
    <div v-if="uploadState.isUploading" class="upload-content">
        <div class="upload-header">
            <h3>Uploading Files</h3>
            <div class="close-button-wrapper">
                <BaseButton label="✕" @click="cancelUpload" />
            </div>
        </div>
        <div class="upload-body">
            <div class="upload-progress">
                <div
                    class="upload-progress-bar"
                    :style="{ width: `${uploadState.progress}%` }">
                </div>
            </div>
            <p>{{ uploadState.currentFile || 'Processing...' }} ({{ uploadState.completedFiles }}/{{ uploadState.totalFiles }})</p>
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

    const emit = defineEmits([EMITS.CLOSE, EMITS.FILES_UPLOADED]);

    // Refs
    const fileInput = ref(null);

    // Upload state management
    const uploadState = reactive({
        isUploading: false,
        progress: 0,
        currentFile: '',
        completedFiles: 0,
        totalFiles: 0,
        uploadedFiles: [],
    });

    // Watch for when upload should be triggered
    watch(() => props.isOpen, (newValue) => {
        if (newValue && fileInput.value) {
            fileInput.value.click();
            // Reset the isOpen prop by emitting close
            emit(EMITS.CLOSE);
        }
    });

    async function onFileSelected(event) {
        const files = Array.from(event.target.files);

        if (files.length === 0) {
            return;
        }

        // Reset upload state
        uploadState.isUploading = true;
        uploadState.progress = 0;
        uploadState.completedFiles = 0;
        uploadState.totalFiles = files.length;
        uploadState.uploadedFiles = [];

        try {
            // Process files one by one
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // Ensure the filename is a string
                uploadState.currentFile = String(file.name || 'Unknown file');
                uploadState.progress = Math.round((i / files.length) * 100);

                // Upload the file
                const uploadedFile = await uploadFile(file);
                uploadState.uploadedFiles.push(uploadedFile);
                uploadState.completedFiles = i + 1;
            }

            // Complete the upload
            uploadState.progress = 100;

            // Emit the uploaded files to parent components
            emit(EMITS.FILES_UPLOADED, uploadState.uploadedFiles);

            // Reset the file input
            if (fileInput.value) {
                fileInput.value.value = '';
            }

            // Close the upload modal after a brief delay
            setTimeout(() => {
                uploadState.isUploading = false;
            }, 1000);
        } catch (error) {
            console.error('Upload failed:', error);
            // Could add error state handling here
            uploadState.isUploading = false;

            // Reset the file input
            if (fileInput.value) {
                fileInput.value.value = '';
            }
        }
    }

    async function uploadFile(file) {
        // This is where you'd implement the actual upload logic
        // For now, I'll create a placeholder that simulates upload

        return new Promise((resolve, _reject) => {
            // Simulate upload delay
            setTimeout(() => {
                // Create a file object with metadata, ensuring all values are properly typed
                const uploadedFile = {
                    name: String(file.name || 'Unknown file'),
                    size: Number(file.size || 0),
                    type: String(file.type || 'application/octet-stream'),
                    lastModified: Number(file.lastModified || Date.now()),
                    url: URL.createObjectURL(file), // Creates a local URL for preview
                    uploadDate: new Date().toISOString(),
                };

                resolve(uploadedFile);
            }, Math.random() * 2000 + 500); // Random delay between 500ms-2.5s
        });
    }

    function cancelUpload() {
        uploadState.isUploading = false;

        // Reset the file input
        if (fileInput.value) {
            fileInput.value.value = '';
        }
    }
</script>

<style scoped lang="scss">
.hidden-file-input {
    display: none;
}

// Upload modal styles
.upload-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1001;
    background-color: var(--speech-bubble-color-background);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    width: min(95vw, 450px);
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.upload-header {
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

.close-button-wrapper {
    :deep(button) {
        background: var(--button-color-background) !important;
        border: none !important;
        border-radius: 50% !important;
        width: 2.5rem !important;
        height: 2.5rem !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 1.25rem !important;
        cursor: pointer !important;
        color: var(--button-color-font) !important;
        transition: all 0.2s ease !important;
        padding: 0 !important;
        min-width: 2.5rem !important;

        &:hover {
            transform: scale(1.05) !important;
            opacity: 0.9 !important;
        }

        &:active {
            transform: scale(0.95) !important;
        }
    }
}

.upload-body {
    text-align: center;

    p {
        color: var(--font-color-secondary);
        margin: 1rem 0;
        font-size: 0.875rem;
        font-weight: 500;
    }
}

.upload-progress {
    width: 100%;
    height: 12px;
    background-color: var(--color-grey-800);
    border-radius: var(--border-radius);
    overflow: hidden;
    margin: 1.5rem 0;
    position: relative;
}

.upload-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-blue) 0%, var(--color-purple) 100%);
    transition: width 0.3s ease;
    border-radius: var(--border-radius);
    position: relative;

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
        animation: shimmer 2s infinite;
    }
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}
</style>
