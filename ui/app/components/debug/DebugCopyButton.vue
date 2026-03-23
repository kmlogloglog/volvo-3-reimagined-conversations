<template>
    <div v-if="isDebug" class="debug-bar">
        <button
            class="debug-bar-btn"
            :class="{ 'debug-bar-btn-success': copied }"
            @click="handleCopy">
            {{ copied ? 'Copied!' : 'Copy Log' }}
        </button>
        <button
            class="debug-bar-btn"
            :class="{ 'debug-bar-btn-success': logged }"
            @click="handleLog">
            {{ logged ? 'Logged!' : 'Log to Console' }}
        </button>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { useDebugLog } from '@/composables/useDebugLog';

    const route = useRoute();
    const { copyToClipboard, logToConsole } = useDebugLog();
    const copied = ref(false);
    const logged = ref(false);

    const isDebug = computed(() => route.query.debug === 'true');

    async function handleCopy() {
        const success = await copyToClipboard();
        if (success) {
            copied.value = true;
            setTimeout(() => { copied.value = false; }, 1500);
        }
    }

    function handleLog() {
        logToConsole();
        logged.value = true;
        setTimeout(() => { logged.value = false; }, 1500);
    }
</script>

<style scoped lang="scss">
    .debug-bar {
        display: flex;
        gap: 4px;
        position: fixed;
        right: 12px;
        top: 12px;
        z-index: 9999;

        &-btn {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 0.75rem;
            padding: 4px 10px;
            backdrop-filter: blur(8px);
            transition: background 0.2s ease;

            &:hover {
                background: rgba(0, 0, 0, 0.7);
            }

            &-success {
                background: rgba(39, 174, 96, 0.7);
            }
        }
    }
</style>
