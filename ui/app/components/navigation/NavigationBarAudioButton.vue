<template>
    <button
        class="nav-button mic-button"
        :class="micButtonClasses"
        :style="{ fontSize: '1.3rem' }"
        :disabled="disabled"
        @click="$emit(EMITS.RECORD_CLICK)">
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
        <span v-else :class="micIconClass"></span>
    </button>
</template>

<script setup>
    import { EMITS } from '@/constants/emits';
    import { ROUTE } from '@/constants/route';

    const props = defineProps({
        active: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        isRecording: {
            type: Boolean,
            default: false,
        },
    });

    defineEmits([EMITS.RECORD_CLICK]);

    // Microphone button classes
    const micButtonClasses = computed(() => ({
        active: props.active,
        recording: props.isRecording && !props.loading,
    }));

    const micIconClass = computed(() => {
        if (!props.active) {
            return ROUTE.AUDIO.icon;
        }

        if (props.isRecording) {
            return 'icon-stop';
        }

        return `${ROUTE.AUDIO.icon}-fill`;
    });
</script>

<style scoped lang="scss">
.nav-button {
    all: unset;
    background-color: var(--navigation-button-color-background);
    border-radius: 9999px;
    box-sizing: border-box;
    color: var(--navigation-button-color-font);
    cursor: pointer;
    height: 100%;
    line-height: 0;
    text-align: center;

    &:active:not(:disabled),
    &.active {
        background-color: var(--navigation-button-active-color-background);
        color: var(--navigation-button-active-color-font);
    }

    &.active:disabled {
        background-color: var(--navigation-button-disabled-color-background);
        color: var(--navigation-button-disabled-color-font);
    }

    &:disabled {
        cursor: default;
        color: var(--navigation-button-disabled-color-font);
    }
}

.mic-button {
    flex: 1;
    width: 5.5rem;

    &.recording {
        background-color: var(--color-red);
        color: var(--color-white);
    }
}

.spinner {
    animation: spin 1s linear infinite;
    display: inline-block;
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
