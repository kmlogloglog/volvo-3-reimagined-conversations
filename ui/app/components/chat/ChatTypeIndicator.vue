<template>
    <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    </div>
</template>

<script setup>

</script>

<style scoped>
.typing-indicator {
    align-items: center;
    display: flex;
    gap: 5px;
    min-height: 1.25rem;
}

.dot {
    animation: bounce 1.4s infinite ease-in-out both;
    aspect-ratio: 1;
    background: #8e8e93;
    border-radius: 50%;
    width: .5rem;
}

.dot:nth-child(1) {
    animation-delay: -0.32s;
}

.dot:nth-child(2) {
    animation-delay: -0.16s;
}

.dot:nth-child(3) {
    animation-delay: 0s;
}

@keyframes bounce {
    0%, 80%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    40% {
        transform: translateY(-.375rem);
        opacity: 1;
    }
}
</style>
