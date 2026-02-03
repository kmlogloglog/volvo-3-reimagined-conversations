<template>
    <template
        v-for="(message, index) in chat"
        :key="index">
        <ChatSpeechBubble
            :align-bubble="message.sender"
            :text="message.content.text"
            :pending="message.pending"
            padding="small"
            @[EMITS.IMAGE_LOADED]="$emit(EMITS.IMAGE_LOADED)"
            @[EMITS.SPEECH_BUBBLE_EXPAND]="$emit(EMITS.SPEECH_BUBBLE_EXPAND, $event)" />
    </template>
</template>

<script setup>
    import ChatSpeechBubble from '@/components/chat/ChatSpeechBubble.vue';
    import { EMITS } from '@/constants/emits.js';

    defineProps({
        chat: {
            type: Array,
            default: () => [],
        },
    });

    defineEmits([
        EMITS.SPEECH_BUBBLE_EXPAND,
        EMITS.IMAGE_LOADED,
    ]);
</script>
