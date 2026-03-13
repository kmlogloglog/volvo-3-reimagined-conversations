<template>
    <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        @change="handleFileSelect" />
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { EMITS } from '@/constants/emits';

    const emit = defineEmits<{
        fileUploaded: [file: File[]]
        uploadError: [error: unknown]
    }>();

    const fileInput = ref<HTMLInputElement | null>(null);

    function handleFileSelect(event: Event) {
        const files = Array.from((event.target as HTMLInputElement).files || []);

        if (files.length > 0) {
            try {
                emit(EMITS.FILE_UPLOADED, files);
            } catch (error) {
                emit(EMITS.UPLOAD_ERROR, error);
            }
        }
    }

    defineExpose<{ triggerFileSelect: () => void }>({
        triggerFileSelect: () => fileInput.value?.click(),
    });
</script>
<style scoped lang="scss">
input {
    display: none;
    position: absolute;
    visibility: hidden;
    pointer-events: none;
}
</style>
