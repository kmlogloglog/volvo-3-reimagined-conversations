<template>
    <button
        class="nav-button"
        :class="{ active }"
        :style="{ fontSize }"
        :disabled="disabled"
        @click="$emit('click')">
        <BaseSpinner v-if="loading" />
        <slot v-else ></slot>
    </button>
</template>

<script setup>
    import BaseSpinner from '@/components/baseComponents/uiElements/BaseSpinner.vue';
    defineProps({
        active: {
            type: Boolean,
            default: false,
        },
        fontSize: {
            type: String,
            default: '1.75rem',
        },
        loading: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    });

    defineEmits(['click']);
</script>

<style scoped lang="scss">
.nav-button {
    all: unset;
    position: relative;
    border-radius: 9999px;
    box-sizing: border-box;
    cursor: pointer;
    aspect-ratio: 1 / 1;
    line-height: 0;
    text-align: center;
    width: 4.625rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;

    // Default: flat semi-transparent, no glass
    background: var(--navigation-button-color-background);
    color: var(--navigation-button-color-font);
    transition:
        background 0.3s ease,
        color 0.3s ease;

    &:active:not(:disabled),
    &.active {
        background: var(--navigation-button-active-color-background);
        color: var(--navigation-button-active-color-font);
    }

    &.active:disabled {
        background: var(--navigation-button-disabled-color-background);
        color: var(--navigation-button-disabled-color-font);
    }

    &:disabled {
        cursor: default;
        color: var(--navigation-button-disabled-color-font);
        opacity: 0.5;
    }
}
</style>
