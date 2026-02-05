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
        filterLastUser: {
            type: Boolean,
            default: false,
        },
        filterLastAgent: {
            type: Boolean,
            default: false,
        },
    });

    const chatFiltered = computed(() => {
        let lastAgentMsg, lastUserMsg;

        if (props.filterLastAgent) {
            lastAgentMsg = props.chat.filter(e => e.sender === AGENT.AGENT).at(-1);
        }
        if (props.filterLastUser) {
            lastUserMsg = props.chat.filter(e => e.sender === AGENT.USER).at(-1);
        }

        // If both filters are active, preserve chat order
        if (props.filterLastAgent && props.filterLastUser) {
            if (!lastAgentMsg && !lastUserMsg) {
                return [];
            }

            if (lastAgentMsg && lastUserMsg) {
                const indices = [
                    { msg: lastAgentMsg, idx: props.chat.indexOf(lastAgentMsg) },
                    { msg: lastUserMsg, idx: props.chat.indexOf(lastUserMsg) },
                ];

                indices.sort((a, b) => a.idx - b.idx);

                return indices.map(i => i.msg);
            }

            if (lastAgentMsg) {
                return [lastAgentMsg];
            }

            if (lastUserMsg) {
                return [lastUserMsg];
            }

            return [];
        }

        if (props.filterLastAgent) {
            return lastAgentMsg ? [lastAgentMsg] : [];
        }

        if (props.filterLastUser) {
            return lastUserMsg ? [lastUserMsg] : [];
        }

        return props.chat;
    });

    defineEmits([
        EMITS.SPEECH_BUBBLE_EXPAND,
        EMITS.IMAGE_LOADED,
    ]);
</script>
