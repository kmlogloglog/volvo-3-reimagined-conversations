<template>
    <div class="chat">
        <div class="chat-stream">
            <div
                ref="panelScrollRef"
                class="panel-scroll"
                :class="{ show, hide: !show }">
                <div class="chat-messages">
                    <ChatStream
                        :chat="agentStore.conversation"
                        :filter-from-last="AGENT.USER"
                        :disabled="!connected"
                        @[EMITS.IMAGE_LOADED]="onImageLoaded"
                        @[EMITS.SPEECH_BUBBLE_EXPAND]="onSpeechBubbleExpand($event)" />
                </div>
            </div>
        </div>
        <div class="chat-input">
            <BaseChatTextArea
                ref="chatTextareaRef"
                v-model="chatMessage"
                :disabled="!connected"
                :loading="agentStore.connecting"
                @submit="handleChatSubmit" />
        </div>
    </div>
</template>

<script setup>
    import BaseChatTextArea from '@/components/baseComponents/uiElements/BaseChatTextArea.vue';
    import ChatStream from '@/components/chat/ChatStream.vue';
    import { EMITS } from '@/constants/emits.js';
    import { AGENT } from '@/constants/agent';
    import { useAgentStore } from '@/stores/agent';
    import { storeToRefs } from 'pinia';

    const agentStore = useAgentStore();
    const { connected } = storeToRefs(agentStore);

    const chatMessage = ref('');
    const chatTextareaRef = useTemplateRef('chatTextareaRef');

    // Reconnects the WebSocket if it has dropped before forwarding the message to the agent.
    async function handleChatSubmit(message) {
        if (!connected.value) {
            console.info('Connection dropped! Reconnecting...');
            try {
                await agentStore.connect();
            } catch {
                return;
            }
        }

        chatMessage.value = '';
        agentStore.sendMessage(message);
    };

    const panelScrollRef = ref(null);
    // Provided to descendant components (e.g. ChatSpeechBubble) so they can
    // adjust scroll position after dynamic content changes like "read more" expansion.
    provide('scrollContainer', panelScrollRef);

    function onSpeechBubbleExpand({ heightDelta, scrollBefore }) {
        if (panelScrollRef.value && heightDelta !== 0) {
            panelScrollRef.value.scrollTop = scrollBefore + heightDelta;
        }
    }

    function setScrollToBottom() {
        requestAnimationFrame(() => {
            if (panelScrollRef.value) {
                panelScrollRef.value.scrollTop = panelScrollRef.value.scrollHeight;
            }
        });
    }

    async function onImageLoaded() {
        setScrollToBottom();
    }

    watch(
        () => agentStore.conversation,
        async () => {
            await nextTick();

            setScrollToBottom();
        },
        { deep: true },
    );

    const show = ref(false);

    onMounted(async() => {
        show.value = true;

        setScrollToBottom();

        chatTextareaRef.value?.focus();
    });
</script>

<style lang="scss" scoped>
    @use '@/scss/mixins' as *;

    .chat {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        row-gap: 1.25rem;

        &-stream {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: flex-end;
            overflow: hidden;
        }

        &-messages {
            display: flex;
            flex-direction: column;
            row-gap: 1rem;
        }

        &-input {
            padding: 0 1.875rem;
        }
    }

    .panel-scroll {
        @include panel-scroll;

        &.hide {
            visibility: hidden;
        }

        &.show {
            visibility: visible;
        }
    }
</style>
