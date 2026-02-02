<template>
    <div class="content-container">

    </div>
</template>

<script setup lang="ts">
    import { onMounted } from 'vue';
    import { useAgentStore } from '@/stores/agentStore';

    const agentStore = useAgentStore();

    onMounted(() => {
        agentStore.startAudio();
    });
</script>

<style lang="scss" scoped>
    .content-container {
        position: relative;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        background-color: var(--bg-primary);
        overflow: hidden;
    }
</style>
