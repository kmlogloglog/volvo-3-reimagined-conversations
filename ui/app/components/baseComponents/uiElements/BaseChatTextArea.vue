<template>
    <div class="chat-text-input-wrapper" :class="{ loading }">
        <textarea
            :id="id"
            ref="textareaRef"
            v-model="vModel"
            type="text"
            class="chat-text-input"
            :disabled="loading"
            placeholder="Ask Freja"
            @keydown.enter.exact.prevent="onSubmit"></textarea>
        <button
            type="button"
            class="button-reset chat-text-button"
            :disabled="loading"
            @click="onSubmit">
            <BaseSpinner v-if="loading" class="chat-text-spinner" />
            <span
                v-else
                class="chat-text-button-icon"
                :class="[vModel === '' ? 'icon-paper-plane dimmed' : 'icon-paper-plane-fill']"></span>
        </button>
    </div>
</template>
<script setup lang="ts">
    import { EMITS } from '@/constants/emits';
    import BaseSpinner from '@/components/baseComponents/uiElements/BaseSpinner.vue';

    interface Props {
        disabled?: boolean
        loading?: boolean
    }

    withDefaults(defineProps<Props>(), {
        disabled: false,
        loading: false,
    });
    const vModel = defineModel<string>({ default: '' });

    const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef');

    const id = useId();

    const emit = defineEmits<{ submit: [value: string] }>();

    function onSubmit() {
        if (vModel.value === '') {
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

    defineExpose<{ focus: () => void }>({
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
            padding: .3rem 2.25rem .3rem 0.75rem;
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

    .chat-text-spinner {
        color: var(--input-color-font-placeholder);
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
    }
</style>
