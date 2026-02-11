<template>
    <div class="content-container">
        <ChatPanel />
    </div>
</template>

<script setup>
    import ChatPanel from '@/components/chat/ChatPanel.vue';
    import { useAgentStore } from '@/stores/agent';

    const agentStore = useAgentStore();

    onMounted(async () => {
        await agentStore.connect();
    });
</script>

<style lang="scss" scoped>
    .content-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        row-gap: 1.25rem;
    }
</style>
