<template>
    <div class="silhouette-layer">
        <div
            class="silhouette-layer-content"
            :class="{ 'silhouette-layer-content-visible': isLoaded }">
            <img
                :src="props.src"
                alt=""
                class="silhouette-layer-img"
                @load="onLoad" />
            <div v-if="props.showShadow" class="silhouette-layer-shadow"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
    interface Props {
        src?: string
        showShadow?: boolean
    }

    const emit = defineEmits<{
        loaded: []
    }>();

    const props = withDefaults(defineProps<Props>(), {
        src: '',
        showShadow: false,
    });

    const isLoaded = ref(false);

    function onLoad() {
        isLoaded.value = true;
        emit('loaded');
    }
</script>

<style lang="scss" scoped>
$duration: 500ms;

.silhouette-layer {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    left: 50%;
    max-width: var(--max-width);
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    width: 100%;

    &-content {
        height: 100%;
        opacity: 0;
        position: relative;
        transition: opacity $duration ease;
        width: 100%;

        &-visible {
            opacity: 1;
        }
    }

    &-img {
        display: block;
        height: 100%;
        object-fit: contain;
        width: 100%;
    }

    &-shadow {
        background: linear-gradient(to bottom, transparent, black 5%, black);
        bottom: 0;
        height: 40%;
        left: 0;
        position: absolute;
        width: 100%;
    }
}
</style>

