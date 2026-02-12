<template>
    <div class="content-container">
        <div ref="mainInnerRef" class="main-inner" :class="{ show }">
            <ChatStream
                :chat="agentStore.conversation"
                :filter-from-last="AGENT.AGENT"
                @[EMITS.IMAGE_LOADED]="onImageLoaded"
                @[EMITS.SPEECH_BUBBLE_EXPAND]="onSpeechBubbleExpand($event)" />
        </div>
    </div>
</template>

<script setup>
    import { useEventBus } from '@vueuse/core';
    import { useAgent } from '@/composables/useAgent';
    import { BUS } from '@/constants/bus.js';
    import ChatStream from '@/components/chat/ChatStream.vue';
    import { EMITS } from '@/constants/emits.js';
    import { AGENT } from '@/constants/agent';
    import { useAgentStore } from '@/stores/agent';

    const agentStore = useAgentStore();
    const agent = useAgent();

    const busRecord = useEventBus(BUS.TOGGLE_RECORD);

    busRecord.on((recording) => {
        if (recording) {
            agent.startAudio();

            return;
        }

        agent.stopAudio();
    });

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

    onMounted(async() => {
        show.value = true;

        setScrollToBottom();
    });

    onUnmounted(() => {
        busRecord.off();

        agent.stopAudio();
    });
</script>

<style lang="scss" scoped>
    .content-container {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        overflow: hidden;
        width: 100%;
        height: 100%;
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
</style>
