<template>
    <button
        class="audio-button"
        :class="{ recording: isRecording, disabled }"
        :disabled="disabled || loading"
        @click="$emit(EMITS.RECORD_CLICK)">

        <span
            v-if="!isRecording"
            class="mic-icon"
            :class="ROUTE.AUDIO.icon" ></span>
        <span
            v-else
            class="mic-inner">
            <span
                v-if="loading"
                class="spinner">
                <BaseSpinner />
            </span>
            <span
                v-else
                class="icon-stop" ></span>
        </span>
    </button>
</template>

<script setup lang="ts">
    import { EMITS } from '@/constants/emits';
    import { ROUTE } from '@/constants/route';
    import BaseSpinner from '@/components/baseComponents/uiElements/BaseSpinner.vue';

    interface Props {
        loading?: boolean
        disabled?: boolean
        isRecording?: boolean
    }

    withDefaults(defineProps<Props>(), {
        loading: false,
        disabled: false,
        isRecording: false,
    });

    defineEmits<{ recordClick: [] }>();
</script>

<style scoped lang="scss">
.audio-button {
    all: unset;
    align-items: center;
    background: var(--navigation-button-color-background);
    border-radius: 2.3125rem;
    box-sizing: border-box;
    color: var(--navigation-button-color-font);
    cursor: pointer;
    display: flex;
    height: 4.625rem;
    justify-content: center;
    position: relative;
    transition:
        width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
        background 0.3s ease;
    width: 4.625rem;

    &.recording {
        background: var(--navigation-button-active-color-background);
        border-radius: 2.3125rem;
        width: 7.1875rem;

        &::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            padding: 1.5px;
            background: linear-gradient(
                315deg,
                rgba(255, 255, 255, 0.55) 0%,
                rgba(255, 255, 255, 0.15) 35%,
                rgba(255, 255, 255, 0.00) 65%,
                rgba(255, 255, 255, 0.05) 100%
            );
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }
    }

    &.disabled {
        cursor: default;

        .mic-inner {
            background: var(--navigation-button-record-disabled-color-background);
            color: var(--navigation-button-record-disabled-color-font);
        }
    }
}

.mic-icon {
    font-size: 2rem;
    line-height: 0;
}

.mic-inner {
    align-items: center;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--navigation-button-record-color-background);
    border-radius: 1.51rem;
    color: var(--navigation-button-record-color-font);
    display: flex;
    font-size: 1.3rem;
    height: 3.25rem;
    justify-content: center;
    line-height: 0;
    position: relative;
    width: 5.3125rem;
    animation: fade-in 0.2s ease both;
    animation-delay: 0.15s;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1.5px;
        background: linear-gradient(
            315deg,
            rgba(255, 255, 255, 0.55) 0%,
            rgba(255, 255, 255, 0.15) 35%,
            rgba(255, 255, 255, 0.00) 65%,
            rgba(255, 255, 255, 0.05) 100%
        );
        -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }
}

@keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}
</style>
