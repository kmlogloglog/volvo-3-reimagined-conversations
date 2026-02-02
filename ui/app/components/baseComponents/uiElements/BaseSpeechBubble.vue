<template>
    <div
        class="speech-bubble-card"
        :data-align="alignBubble"
        :data-padding="padding">
        <slot></slot>
    </div>
</template>

<script setup>
    defineProps({
        fullWidth: { type: Boolean, default: false },
        alignBubble: {
            type: String,
            default: 'none',
            validator: (value) => ['left', 'right', 'none'].includes(value),
        },
        padding: {
            type: String,
            default: '',
            validator: (value) => ['small', 'large', ''].includes(value),
        },
    });
</script>
<style lang="scss" scoped>
    .speech-bubble {
        &-card {
            background: var(--speech-bubble-color-background);
            border-radius: var(--border-radius);
            color: var(--speech-bubble-color-font);
            margin: 0 auto;
            padding: 1rem;
            position: relative;
            width: fit-content;
            max-width: 85%;

            &[data-align="left"] {
                border-radius: var(--border-radius) var(--border-radius) var(--border-radius) 0;
                margin-left: 0;
            }

            &[data-align="right"] {
                border-radius: var(--border-radius) var(--border-radius) 0 var(--border-radius);
                margin-right: 0;
                background-color: var(--color-grey-200);
                color: var(--color-black);

                // Dark mode override if needed, or rely on variables
                @media (prefers-color-scheme: dark) {
                     background-color: var(--color-grey-800);
                     color: var(--color-white);
                }
            }
            &[data-padding="large"] {
                padding: 1.5rem;
            }
        }
    }
</style>
