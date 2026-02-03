<template>
    <button
        class="nav-button mic-button"
        :class="micButtonClasses"
        :style="{ fontSize: '1.3rem' }"
        :disabled="disabled"
        @click="handleMicrophoneClick">
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
        @click="handlePauseClick">
        <span :class="pauseIconClass"></span>
    </button>
</template>

<script setup>
    import { NAVIGATION } from '@/constants/navigation.js';

    const props = defineProps({
        active: {
            type: Boolean,
            default: false,
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

    const emit = defineEmits(['select', 'recording-change']);

    // Internal recording state
    const isRecording = ref(false);
    const isPaused = ref(false);

    // Computed states
    const isIdle = computed(() => props.active && isPaused.value);

    // Microphone button
    const micButtonClasses = computed(() => ({
        active: props.active,
        recording: isRecording.value,
        paused: isIdle.value,
    }));

    const micIconClass = computed(() => {
        if (!props.active) {
            return NAVIGATION.AUDIO.icon;
        }

        if (isRecording.value && !isPaused.value) {
            return 'icon-stop';
        }

        return `${NAVIGATION.AUDIO.icon}-fill`;
    });

    // Pause button
    const pauseButtonClasses = computed(() => ({
        paused: isPaused.value && isRecording.value,
    }));

    const pauseIconClass = computed(() =>
        props.active ? `${NAVIGATION.PAUSE.icon}-fill` : NAVIGATION.PAUSE.icon,
    );

    // Actions test
    function handleMicrophoneClick() {
        if (props.active) {
            if (isPaused.value) {
                // If paused, unpause and continue recording
                isPaused.value = false;
            } else if (isRecording.value) {
                // If recording (and not paused), stop recording
                isRecording.value = false;
            } else {
                // If not recording, start recording
                isRecording.value = true;
            }
            emit('recording-change', { isRecording: isRecording.value, isPaused: isPaused.value });
        } else {
            // Select this navigation item
            emit('select');
        }
    }

    function handlePauseClick() {
        if (!isRecording.value) return;

        isPaused.value = !isPaused.value;
        emit('recording-change', { isRecording: isRecording.value, isPaused: isPaused.value });
    }

    // Reset state when becoming inactive
    function reset() {
        isRecording.value = false;
        isPaused.value = false;
    }

    // Expose reset for parent to call when switching away
    defineExpose({ reset });
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
