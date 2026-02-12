<template>
    <div class="content-container">
        <div class="chat-stream">
            <div ref="mainInnerRef" class="main-inner" :class="{ show }">
                <ChatStream
                    :chat="agentStore.conversation"
                    :filter-from-last="AGENT.USER"
                    @[EMITS.IMAGE_LOADED]="onImageLoaded"
                    @[EMITS.SPEECH_BUBBLE_EXPAND]="onSpeechBubbleExpand($event)" />
            </div>
        </div>
        <div class="chat-input">
            <BaseChatTextArea
                v-model="chatMessage"
                :disabled="!agentStore.connected"
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

    const agentStore = useAgentStore();

    const chatMessage = ref('');

    async function handleChatSubmit(message) {
        chatMessage.value = '';

        if (!agentStore.connected) {
            console.info('Connection dropped! Reconnecting...');
            await agentStore.connect();
        }

        agentStore.sendMessage(message);
    };

    const mainInnerRef = ref(null);
    provide('scrollContainer', mainInnerRef);

    function onSpeechBubbleExpand({ heightDelta, scrollBefore }) {
        if (mainInnerRef.value && heightDelta !== 0) {
            mainInnerRef.value.scrollTop = scrollBefore + heightDelta;
        }
    }

    function setScrollToBottom() {
        requestAnimationFrame(() => {
            if (mainInnerRef.value) {
                mainInnerRef.value.scrollTop = mainInnerRef.value.scrollHeight;
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

    onMounted(() => {
        show.value = true;

        setScrollToBottom();

        agentStore.connect();
    });
</script>

<style lang="scss" scoped>
    .content-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        row-gap: 1.25rem;

        .chat-stream {
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: flex-end;
            overflow: hidden;
            width: 100%;
            -webkit-overflow-scrolling: touch;

            .main-inner {
                display: flex;
                flex-direction: column;
                overflow: auto;
                padding: 1.25rem 1.25rem 0;
                row-gap: 1rem;
                overflow-anchor: none;
                visibility: hidden;

                &.show {
                    visibility: visible;
                }
            }
        }

        .chat-input {
            padding: 0 1.25rem;
        }
    }
</style>
