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

<script setup>
    import { ref, watch } from 'vue';
    import BackgroundImagesCarousel from '@/components/imageViewer/BackgroundImagesCarousel.vue';

    const props = defineProps({
        src: {
            type: Array,
            default: () => [],
            validator: (value) => Array.isArray(value),
        },
    });

    let idCounter = 0;

    const instances = ref([
        { id: idCounter++, src: props.src },
    ]);

    watch(
        () => props.src,
        (newSrc) => {
            // Push the new carousel — it enters (fades in) beneath the current one
            instances.value.push({ id: idCounter++, src: newSrc });

            // Immediately mark the old one for removal so Vue starts its leave transition
            instances.value.shift();
        },
    );

    // Called by TransitionGroup once the leave transition has fully completed.
    // Nothing left to clean up manually — Vue already removed the element.
    function onAfterLeave() {
        // No-op: DOM cleanup is handled by TransitionGroup.
        // Hook kept here in case you need side-effects (e.g. emitting an event).
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
