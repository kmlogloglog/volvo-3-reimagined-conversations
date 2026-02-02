<template>
    <main>
        <div ref="mainInnerRef" class="main-inner" :class="{ show }">
            <ChatStream
                :chat="chat"
                @[EMITS.IMAGE_LOADED]="onImageLoaded"
                @[EMITS.SPEECH_BUBBLE_EXPAND]="onSpeechBubbleExpand($event)" />
        </div>
    </main>
    <footer>
        <BaseChatTextArea
            v-model="chatMessage"
            @submit="handleChatSubmit" />
    </footer>
</template>
<script setup>
    import { computed, ref, onMounted, provide } from 'vue';
    import { useAgentStore } from '@/stores/agentStore';
    import BaseChatTextArea from '@/components/baseComponents/uiElements/BaseChatTextArea.vue';
    import ChatStream from '@/components/chat/ChatStream.vue';
    import { EMITS } from '@/constants/emits.js';

    const agentStore = useAgentStore();
    const chat = computed(() => agentStore.messages);

    const chatMessage = ref('');

    async function handleChatSubmit(payload) {
        const text = (typeof payload === 'string' ? payload : chatMessage.value).trim();

        if (!text) return;

        // Ensure connected
        if (!agentStore.connected) {
            try {
                await agentStore.connect();
            } catch (e) {
                console.error('Failed to connect', e);
                return;
            }
        }

        agentStore.sendMessage(text);
        chatMessage.value = '';
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
            padding: 1.25rem 1.25rem 0;
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
