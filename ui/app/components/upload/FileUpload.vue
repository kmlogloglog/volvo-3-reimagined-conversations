<template>
    <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        @change="handleFileSelect" />
</template>

<script setup>
    import { ref } from 'vue';
    import { EMITS } from '@/constants/emits.js';

    const emit = defineEmits([EMITS.FILE_UPLOADED, EMITS.UPLOAD_ERROR]);

    const fileInput = ref(null);

    function handleFileSelect(event) {
        const files = Array.from(event.target.files || []);

        if (files.length > 0) {
            try {
                emit(EMITS.FILE_UPLOADED, files);
            } catch (error) {
                emit(EMITS.UPLOAD_ERROR, error);
            }
        }
    }

    defineExpose({
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
