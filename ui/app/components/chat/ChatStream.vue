<template>
    <template
        v-for="(message) in chatFiltered"
        :key="message.id">
        <ChatSpeechBubble
            :align-bubble="message.sender"
            :text="message.content?.text || ''"
            :finished="message.finished"
            :disabled="disabled"
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
        disabled: {
            type: Boolean,
            default: false,
        },
    });

    // Filters out the intro message, sorts by timestamp, then trims to messages since the last user turn.
    const chatFiltered = computed(() => {
        const arr = Array.isArray(props.chat) ? props.chat : [];
        const chatArr = arr.filter(e => e?.content?.text !== AGENT.INTRODUCTION);

        chatArr.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        if (props.filterFromLast === AGENT.USER) {
            const index = [...chatArr].reverse().findIndex(e => e?.sender === AGENT.USER);

            if (index < 0) {
                return chatArr;
            }

            return chatArr.slice(chatArr.length - index - 1);
        }

        if (props.filterFromLast === AGENT.AGENT) {
            const index = [...chatArr].reverse().findIndex(e => e?.sender === AGENT.USER);

            if (index < 0) {
                return chatArr;
            }

            return chatArr.slice(chatArr.length - index);
        }

        return chatArr;
    });

    defineEmits([
        EMITS.SPEECH_BUBBLE_EXPAND,
        EMITS.IMAGE_LOADED,
    ]);
</script>
