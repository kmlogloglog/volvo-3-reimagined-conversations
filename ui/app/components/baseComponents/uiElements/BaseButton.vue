<template>
    <button class="button-reset">{{ label }}</button>
</template>

<script setup>
    defineProps({
        label: {
            type: String,
            default: 'Button',
        },

    });
</script>
<style lang="scss" scoped>
    button {
        background-color: var(--input-color-background);
        border-radius: var(--border-radius);
        color: var(--input-color-font);
        font-size: 1rem;
        height: 2.5rem;
        outline: none;
        padding: 0.5rem 1rem;
        transition: border-color 0.3s;
        width: 100%;

        &:disabled {
            cursor: default;
            color: var(--input-color-font-placeholder-disabled);
        }
    }
</style>
