<template>
    <button
        class="button-reset"
        :class="{ active }"
        :style="{ fontSize }"
        :disabled="disabled"
        @click="$emit('click')">
        <span
            v-if="loading"
            class="spinner">
            <svg viewBox="0 0 100 100">
                <circle
                    cx="50" cy="50" r="40"
                    fill="none"
                    stroke="#ffffff"
                    stroke-width="4"
                    stroke-dasharray="209 251" />
            </svg>
        </span>
        <span
            v-else
            :class="iconClass"></span>
    </button>
</template>

<script setup>
    const props = defineProps({
        icon: {
            type: String,
            required: true,
        },
        active: {
            type: Boolean,
            default: false,
        },
        fontSize: {
            type: String,
            default: '1.15rem',
        },
        loading: {
            type: Boolean,
            default: false,
        },
        disabled : {
            type: Boolean,
            default: false,
        },
    });

    defineEmits(['click']);

    const iconClass = computed(() => props.active ? `${props.icon}-fill` : props.icon);
</script>

<style scoped lang="scss">
button {
    background-color: var(--navigation-button-color-background);
    border-radius: 9999px;
    box-sizing: border-box;
    color: var(--navigation-button-color-font);
    cursor: pointer;
    flex: 1;
    height: 100%;
    line-height: 0;
    text-align: center;
    width: 5.5rem;

    &.active {
        background-color: var(--navigation-button-active-color-background);
        color: var(--navigation-button-active-color-font);
    }

    &:disabled {
        cursor: default;
        opacity: 0.5;
    }
}

.spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
    width: 20px;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
