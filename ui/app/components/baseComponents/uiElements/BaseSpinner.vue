<template>
    <span class="base-spinner">
        <svg viewBox="0 0 100 100">
            <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
                stroke-dasharray="209 251" />
        </svg>
    </span>
</template>

<script setup>
</script>

<style scoped lang="scss">
.base-spinner {
    animation: spin 1s linear infinite;
    display: inline-block;
    width: 20px;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}
</style>
