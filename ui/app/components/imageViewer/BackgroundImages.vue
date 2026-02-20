<template>
    <!--
        Each time `src` changes, a new BackgroundImagesCarousel is mounted with
        a unique key and fades in, while the previous one fades out and is then
        removed from the DOM. The carousel component itself stays simple and
        owns no transition logic.
    -->
    <TransitionGroup name="carousel-swap" tag="div" class="carousel-stage">
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

    // ─── Timing — adjust to taste ─────────────────────────────────────────────
    const TRANSITION_DURATION = 1000; // ms, must match $duration in <style>

    const props = defineProps({
        src: {
            type: Array,
            default: () => [],
            validator: (value) => Array.isArray(value),
        },
    });

    // Each instance gets a unique id so Vue's TransitionGroup can track them
    // independently even if the same src array is passed twice.
    let idCounter = 0;

    const instances = ref([
        { id: idCounter++, src: props.src },
    ]);

    watch(
        () => props.src,
        (newSrc) => {
            // Mount the new carousel on top — it fades in via CSS
            instances.value.push({ id: idCounter++, src: newSrc });

            // After the outgoing carousel has finished fading out, remove it
            setTimeout(() => {
                instances.value.shift();
            }, TRANSITION_DURATION);
        },
    );
</script>

<style lang="scss" scoped>
// !! Keep $duration in sync with TRANSITION_DURATION in <script> above !!
$duration : 1000ms;
$blur     : 16px;

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

// Incoming carousel: starts blurred + transparent, resolves to sharp + opaque
.carousel-swap-enter-active {
    transition:
        opacity $duration ease,
        filter  $duration ease;
    z-index: 2; // new instance sits on top while entering
}
.carousel-swap-enter-from {
    opacity: 0;
    filter: blur($blur);
}
.carousel-swap-enter-to {
    opacity: 1;
    filter: blur(0px);
}

// Outgoing carousel: instantly hidden — it sits underneath the incoming one
// so there's nothing to animate; removing it is invisible.
.carousel-swap-leave-active {
    transition: none;
    z-index: 1;
}
.carousel-swap-leave-from,
.carousel-swap-leave-to {
    opacity: 1;
    filter: blur(0px);
}
</style>
