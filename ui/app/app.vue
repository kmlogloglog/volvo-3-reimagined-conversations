<template>
    <div id="app">
        <NuxtPage />
    </div>
</template>

<script setup>
    import { useAgentStore } from '@/stores/agent';
    import { AGENT } from '@/constants/agent.js';

    const agentStore = useAgentStore();

    // Append a UUID so each browser session gets a unique user identity.
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
