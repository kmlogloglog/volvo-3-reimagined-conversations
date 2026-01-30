<template>
    <div class="chat-text-input-wrapper">
        <textarea
            :id="id"
            v-model="vModel"
            type="text"
            class="chat-text-input"
            :placeholder="placeholderTxt"
        ></textarea>
        <button
            type="button"
            class="button-reset chat-text-button"
            @click="onSubmit">
            <span
                class="chat-text-button-icon"
                :class="[vModel === '' ? 'icon-paper-plane dimmed' : 'icon-paper-plane-fill']"></span>
        </button>
    </div>
</template>
<script setup>

    import { useId, ref, computed, watch } from 'vue';

    const id = useId();

    const vModel = defineModel({
        type: String,
        default: '',
    });

    const isListening = ref(false);
    const placeholderTxt = computed(() => isListening.value ? 'Recording' : 'Ask Gemeni');

    function onSubmit() {
        if(vModel.value === '') {
            isListening.value = !isListening.value;

            return;
        }
        vModel.value = '';
    }

    watch(vModel, (newVal) => {
        if(newVal.length) {
            isListening.value = false;
        }
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
        }

        &-button {
            bottom: .55rem;
            position: absolute;
            right: .75rem;
            z-index: 1;

            &-icon {
                color: var(--input-color-font-placeholder);
            }
        }
    }
</style>
