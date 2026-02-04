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
    <button
        v-if="isRecording"
        class="nav-button pause-button"
        :class="pauseButtonClasses"
        :style="{ fontSize: '1.05rem' }"
        :disabled="disabled"
        @click="$emit(EMITS.PAUSE_CLICK)">
        <span :class="pauseIconClass"></span>
    </button>
</template>

<script setup>
    import { EMITS } from '@/constants/emits';
    import { NAVIGATION } from '@/constants/navigation';

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
        isPaused: {
            type: Boolean,
            default: false,
        },
    });

    defineEmits([EMITS.RECORD_CLICK, EMITS.PAUSE_CLICK]);

    // Computed states for styling only
    const isIdle = computed(() => props.active && props.isPaused);

    // Microphone button classes
    const micButtonClasses = computed(() => ({
        active: props.active,
        recording: props.isRecording && !props.loading,
        paused: isIdle.value,
    }));

    const micIconClass = computed(() => {
        if (!props.active) {
            return NAVIGATION.AUDIO.icon;
        }

        if (props.isRecording && !props.isPaused) {
            return 'icon-stop';
        }

        return `${NAVIGATION.AUDIO.icon}-fill`;
    });

    // Pause button classes
    const pauseButtonClasses = computed(() => ({
        paused: props.isPaused && props.isRecording,
    }));

    const pauseIconClass = computed(() =>
        props.active ? `${NAVIGATION.PAUSE.icon}-fill` : NAVIGATION.PAUSE.icon,
    );
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

    &.active {
        background-color: var(--navigation-button-active-color-background);
        color: var(--navigation-button-active-color-font);
    }

    &:disabled {
        cursor: default;
        opacity: 0.5;
    }
}

.mic-button {
    width: 5.5rem;
    flex: 1;

    &.recording {
        background-color: var(--color-red);
        color: var(--color-white);
    }

    &.paused {
        background-color: var(--navigation-audio-button-paused-color-background);
        color: var(--navigation-audio-button-paused-color-font);
    }

    &:disabled {
        cursor: default;
        opacity: 0.5;
    }
}

.pause-button {
    aspect-ratio: 1 / 1;
    flex: 0;
    height: 100%;
    margin-left: 0.3125rem;
    margin-right: 0.3125rem;
    background-color: var(--navigation-button-active-color-background);
    color: var(--navigation-button-color-font);

    &:disabled {
        cursor: default;
        opacity: 0.5;
    }

    &.paused {
        color: var(--navigation-pause-button-paused-color-font);
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
