<template>
    <button class="base-button button-reset">{{ label }}</button>
</template>

<script setup lang="ts">
    interface Props {
        label?: string
    }

    withDefaults(defineProps<Props>(), {
        label: 'Button',
    });
</script>
<style lang="scss" scoped>
    .base-button {
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
