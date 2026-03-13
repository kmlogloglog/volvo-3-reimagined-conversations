<template>
    <div class="message-container">
        <span>Listening...</span>
    </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
    .message-container {
        background: var(--navigation-button-color-background);
        border-radius: 999999px;
        bottom: 30vh;
        color: var(--navigation-button-color-font);
        font-size: 1rem;
        font-weight: normal;
        left: 50%;
        line-height: 2rem;
        padding: 0 1.25rem;
        position: fixed;
        transform: translateX(-50%);
        z-index: 10;
    }
</style>
