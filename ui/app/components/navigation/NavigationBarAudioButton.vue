<template>
    <button
        class="nav-button mic-button"
        :class="micButtonClasses"
        :style="{ fontSize: '1.3rem' }"
        @click="handleMicrophoneClick">
        <span :class="micIconClass"></span>
    </button>
    <button
        v-if="isRecording"
        class="nav-button pause-button"
        :class="pauseButtonClasses"
        :style="{ fontSize: '1.05rem' }"
        @click="handlePauseClick">
        <span :class="pauseIconClass"></span>
    </button>
</template>

<script setup>
    import { NAVIGATION } from '@/constants/navigation.js';
    import { useAgentStore } from '@/stores/agentStore';

    const props = defineProps({
        active: {
            type: Boolean,
            default: false,
        },
    });

    const emit = defineEmits(['select', 'recording-change']);
    const agentStore = useAgentStore();

    // Internal recording state
    // We sync with agentStore.listening if active
    const isRecording = computed({
        get: () => agentStore.listening,
        set: (val) => {
            if (val) agentStore.startAudio();
            else agentStore.stopAudio();
        },
    });

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
        if (!props.active || !isRecording.value) {
            return NAVIGATION.AUDIO.icon;
        }

        // If recording and not paused (and active)
        return 'icon-stop';
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
            if (isRecording.value) {
                // If recording (red), stop completely (disconnect)
                agentStore.disconnect();
            } else {
                // If off, START (connect)
                agentStore.startAudio();
            }
        } else {
            // Select this navigation item
            emit('select');

            // Auto-start recording when navigating to Audio tab via mic button
            setTimeout(() => {
                agentStore.startAudio();
            }, 100);
        }
    }

    function handlePauseClick() {
        if (!isRecording.value) return;

        if (agentStore.isMuted) {
            agentStore.unmuteAudio();
        } else {
            agentStore.muteAudio();
        }
    }

    // Reset state when becoming inactive
    function reset() {
        // Do nothing on verify? User wanted it persistent.
        // But if we want to ensure cleaner state on full reset, maybe?
        // For now leave empty or remove usage.
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
}

.pause-button {
    aspect-ratio: 1 / 1;
    flex: 0;
    height: 100%;
    margin-left: 0.3125rem;
    margin-right: 0.3125rem;
    background-color: var(--navigation-button-active-color-background);
    color: var(--navigation-button-color-font);

    &.paused {
        color: var(--navigation-pause-button-paused-color-font);
    }
}
</style>
