<template>
    <button
        class="button-reset"
        :class="{ active }"
        :style="{ fontSize }"
        @click="$emit('click')">
        <span :class="iconClass"></span>
    </button>
</template>

<script setup>
    const props = defineProps({
        icon: {
            type: String,
            required: true,
        },
        active: {
            type: Boolean,
            default: false,
        },
        fontSize: {
            type: String,
            default: '1.15rem',
        },
    });

    defineEmits(['click']);

    const iconClass = computed(() => props.active ? `${props.icon}-fill` : props.icon);
</script>

<style scoped lang="scss">
button {
    background-color: var(--navigation-button-color-background);
    border-radius: 9999px;
    box-sizing: border-box;
    color: var(--navigation-button-color-font);
    cursor: pointer;
    flex: 1;
    height: 100%;
    line-height: 0;
    text-align: center;
    width: 5.5rem;

    &.active {
        background-color: var(--navigation-button-active-color-background);
        color: var(--navigation-button-active-color-font);
    }
}
</style>
