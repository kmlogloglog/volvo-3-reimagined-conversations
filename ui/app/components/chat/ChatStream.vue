<template>
    <template
        v-for="(message, index) in chat"
        :key="index">
        <BookingInfoCard
            v-if="message.type === 'booking'"
            :time="message.content.time"
            :date="message.content.date"
            :address="{
                name: message.content.address.name,
                street: message.content.address.street,
                city: message.content.address.city
            }"
            @[EMITS.IMAGE_LOADED]="$emit(EMITS.IMAGE_LOADED)" />
        <ChatSpeechBubble
            v-else
            :align-bubble="message.sender === 'user' ? 'right' : 'left'"
            :text="message.content.text"
            padding="small"
            @[EMITS.IMAGE_LOADED]="$emit(EMITS.IMAGE_LOADED)"
            @[EMITS.SPEECH_BUBBLE_EXPAND]="$emit(EMITS.SPEECH_BUBBLE_EXPAND, $event)" />
    </template>
</template>

<script setup>
    import BookingInfoCard from '@/components/booking/BookingInfoCard.vue';
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
