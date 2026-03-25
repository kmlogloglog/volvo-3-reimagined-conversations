<template>
    <div id="app">
        <NuxtPage />
    </div>
</template>

<script setup lang="ts">
    import { useAgentStore } from '@/stores/agent';
    import { AGENT } from '@/constants/agent';

    const agentStore = useAgentStore();

    onBeforeMount(() => {
        agentStore.setUserName(`${AGENT.DEFAULT_USER_NAME}_${crypto.randomUUID()}`);
    });
</script>

<style scoped lang="scss">
#app {
    background-color: var(--app-background-color);
    min-height: calc(150vh + 1px);
}
</style>
