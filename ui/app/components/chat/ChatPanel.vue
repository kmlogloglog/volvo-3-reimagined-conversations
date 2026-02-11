<template>
    <main>
        <div ref="mainInnerRef" class="main-inner" :class="{ show }">
            <ChatStream
                :chat="agentStore.conversation"
                :filter-last-agent="true"
                :filter-last-user="true"
                @[EMITS.IMAGE_LOADED]="onImageLoaded"
                @[EMITS.SPEECH_BUBBLE_EXPAND]="onSpeechBubbleExpand($event)" />
        </div>
    </main>
    <footer>
        <BaseChatTextArea
            v-model="chatMessage"
            :disabled="!agentStore.connected"
            @submit="handleChatSubmit" />
    </footer>
</template>
<script setup>
    import BaseChatTextArea from '@/components/baseComponents/uiElements/BaseChatTextArea.vue';
    import ChatStream from '@/components/chat/ChatStream.vue';
    import { EMITS } from '@/constants/emits.js';
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
        () => {
            setScrollToBottom();
        },
        { deep: true },
    );

    const show = ref(false);

    onMounted(async() => {
        setScrollToBottom();
        show.value = true;
    });
</script>
<style lang="scss" scoped>
    main {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
        justify-content: flex-end;

        .main-inner {
            display: flex;
            flex-direction: column;
            overflow: auto;
            padding: 0 1.25rem;
            row-gap: 1rem;
            overflow-anchor: none;
            visibility: hidden;

            &.show {
                visibility: visible;
            }
        }
    }

    footer {
        padding: 0 1.25rem 1.25rem;
    }
</style>

