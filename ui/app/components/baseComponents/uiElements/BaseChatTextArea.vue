<template>
    <div class="chat-text-input-wrapper" :class="{ loading }">
        <textarea
            :id="id"
            ref="textareaRef"
            v-model="vModel"
            type="text"
            class="chat-text-input"
            :disabled="disabled || loading"
            :placeholder="placeholderTxt"
            @keydown.enter.prevent="onSubmit"></textarea>
        <button
            type="button"
            class="button-reset chat-text-button"
            :disabled="disabled || loading"
            @click="onSubmit">
            <span
                v-if="loading"
                class="spinner">
                <svg viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="4"
                        stroke-dasharray="209 251" />
                </svg>
            </span>
            <span
                v-else
                class="chat-text-button-icon"
                :class="[vModel === '' ? 'icon-paper-plane dimmed' : 'icon-paper-plane-fill']"></span>
        </button>
    </div>
</template>
<script setup>
    import { EMITS } from '@/constants/emits.js';

    defineProps({
        disabled: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    });
    const vModel = defineModel({
        type: String,
        default: '',
    });

    const textareaRef = useTemplateRef('textareaRef');

    const id = useId();

    const emit = defineEmits([EMITS.SUBMIT]);

    const isListening = ref(false);
    const placeholderTxt = computed(() => isListening.value ? 'Recording' : 'Ask Volvo Vän');

    function onSubmit() {
        if(vModel.value === '') {
            isListening.value = !isListening.value;
            return;
        }

        emit(EMITS.SUBMIT, vModel.value);
        vModel.value = '';
    }

    function focus() {
        const textarea = textareaRef.value;
        if (textarea) {
            textarea.focus();
        }
    }

    defineExpose({
        focus,
    });

</script>

<style lang="scss" scoped>
    .chat-text-input-wrapper {
        display: flex;
        width: 100%;
        position: relative;
    }

    .chat-text {
        &-input {
            background-color: var(--input-color-background);
            border-color: var(--input-color-background);
            border-radius: var(--border-radius);
            border-style: solid;
            border-width: 0.25rem 0rem;
            color: var(--input-color-font);
            field-sizing: content;
            font-size: 1rem;
            line-height: normal;
            max-height: 7.5rem;
            min-height: 2.5rem;
            outline: none;
            padding-right: 40px;
            padding: 0.3rem .75rem;
            resize: none;
            transition: border-color 0.3s;
            width: 100%;

            &::placeholder {
                color: var(--input-color-font-placeholder);
            }

            &:disabled,
            &.loading {
                &::placeholder {
                    color: var(--input-color-font-placeholder-disabled);
                }
            }
        }

        &-button {
            align-items: center;
            bottom: .55rem;
            display: flex;
            min-height: 1.5rem;
            position: absolute;
            right: .75rem;
            z-index: 1;

            &-icon {
                color: var(--input-color-font-placeholder);
            }

            &:disabled,
            &.loading {
                & .chat-text-button-icon {
                    color: var(--input-color-font-placeholder-disabled);
                }
            }
        }
    }

    .spinner {
        animation: spin 1s linear infinite;
        color: var(--input-color-font-placeholder);
        display: inline-block;
        width: 20px;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
    }
</style>
