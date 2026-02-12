<template>
    <template
        v-for="(message) in chatFiltered"
        :key="message.id">
        <ChatSpeechBubble
            :align-bubble="message.sender"
            :text="message.content?.text || ''"
            :finished="message.finished"
            padding="small"
            @[EMITS.IMAGE_LOADED]="$emit(EMITS.IMAGE_LOADED)"
            @[EMITS.SPEECH_BUBBLE_EXPAND]="$emit(EMITS.SPEECH_BUBBLE_EXPAND, $event)" />
    </template>
</template>

<script setup>
    import ChatSpeechBubble from '@/components/chat/ChatSpeechBubble.vue';
    import { EMITS } from '@/constants/emits';
    import { AGENT } from '@/constants/agent';

    const props = defineProps({
        chat: {
            type: Array,
            default: () => [],
        },
        filterFromLast: {
            type: String,
            default: '',
            validator: (value) => [AGENT.USER, AGENT.AGENT, ''].includes(value),
        },
    });

    const chatFiltered = computed(() => {
        // Ensure we have a valid array
        const chatArr = Array.isArray(props.chat) ? props.chat : [];

        if (props.filterFromLast === AGENT.USER) {
            // last user message index
            const index = [...chatArr].reverse().findIndex(e => e?.sender === AGENT.USER);

            if (index < 0) {
                return chatArr;
            }

            // create a new array with messages from the last user message
            return chatArr.slice(chatArr.length - index - 1);
        }

        if (props.filterFromLast === AGENT.AGENT) {
            // last user message index
            const index = [...chatArr].reverse().findIndex(e => e?.sender === AGENT.USER);

            if (index < 0) {
                return chatArr;
            }

            // create a new array with messages from the last agent message
            return chatArr.slice(chatArr.length - index);
        }

        return chatArr;
    });

    defineEmits([
        EMITS.SPEECH_BUBBLE_EXPAND,
        EMITS.IMAGE_LOADED,
    ]);
</script>
