<template>
    <TransitionGroup
        name="carousel-swap"
        tag="div"
        class="carousel-stage"
        @after-leave="onAfterLeave">
        <BackgroundImagesCarousel
            v-for="instance in instances"
            :key="instance.id"
            :src="instance.src"
            class="carousel-layer" />
    </TransitionGroup>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import BackgroundImagesCarousel from '@/components/imageViewer/BackgroundImagesCarousel.vue';

    interface Props {
        src?: string[]
    }

    const props = withDefaults(defineProps<Props>(), {
        src: () => [],
    });

    let idCounter = 0;

    const instances = ref<Array<{ id: number; src: string[] }>>([
        { id: idCounter++, src: props.src },
    ]);

    watch(
        () => props.src,
        (newSrc) => {
            instances.value.push({ id: idCounter++, src: newSrc });
            instances.value.shift();
        },
    );

    // Required by TransitionGroup; intentionally empty (Vue handles DOM cleanup).
    function onAfterLeave() {
    }
</script>

<style lang="scss" scoped>
$duration: 1500ms;
$blur: 16px;

.carousel-stage {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 0;
}

.carousel-layer {
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
}

.carousel-swap-enter-active {
    transition: opacity $duration ease, filter $duration ease;
    z-index: 1;
}

.carousel-swap-enter-from {
    opacity: 0;
    filter: blur($blur);
}

.carousel-swap-enter-to {
    opacity: 1;
    filter: blur(0px);
}

.carousel-swap-leave-active {
    transition: opacity $duration ease, filter $duration ease;
    z-index: 2;
}

.carousel-swap-leave-from {
    opacity: 1;
    filter: blur(0px);
}

.carousel-swap-leave-to {
    opacity: 0;
    filter: blur($blur);
}
</style>
