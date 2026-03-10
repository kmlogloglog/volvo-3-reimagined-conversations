<template>
    <div
        class="speech-bubble-card"
        :data-align="alignBubble"
        :data-padding="padding"
        :class="{ 'full-width': fullWidth, disabled }">
        <slot></slot>
    </div>
</template>

<script setup>
    import { AGENT } from '@/constants/agent';

    defineProps({
        alignBubble: {
            type: String,
            default: 'none',
            validator: (value) => [AGENT.USER, AGENT.AGENT, 'none'].includes(value),
        },
        padding: {
            type: String,
            default: '',
            validator: (value) => ['small', 'large', ''].includes(value),
        },
        fullWidth: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
    });
</script>
<style lang="scss" scoped>
    .speech-bubble {
        &-card {
            background: var(--speech-bubble-agent-color-background);
            border-radius: var(--border-radius);
            color: var(--speech-bubble-agent-color-font);
            margin: 0 auto;
            max-width: 85%;
            padding: 0.75rem 1.25rem;
            position: relative;
            width: fit-content;

            &.disabled {
                color: var(--speech-bubble-agent-disabled-color-font);
            }

            &.full-width {
                max-width: 100%;
                width: 100%;
                padding: 1.25rem;
            }

            &[data-align="agent"] {
                background: var(--speech-bubble-agent-color-background);
                color: var(--speech-bubble-agent-color-font);
                border-radius: var(--border-radius) var(--border-radius) var(--border-radius) 0;
                margin-left: 0;

                &.disabled {
                    color: var(--speech-bubble-agent-disabled-color-font);
                }
            }

            &[data-align="user"] {
                border-radius: var(--border-radius) var(--border-radius) 0 var(--border-radius);
                margin-right: 0;
                background: var(--speech-bubble-user-color-background);
                color: var(--speech-bubble-user-color-font);

                &.disabled {
                    color: var(--speech-bubble-user-disabled-color-font);
                }
            }

            &[data-padding="large"] {
                padding: 1.5rem;
            }
        }
    }
</style>
