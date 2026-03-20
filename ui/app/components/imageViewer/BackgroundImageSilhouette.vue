<template>
    <div class="image-container">
        <TransitionGroup
            name="image-swap"
            tag="div"
            class="image-stage">
            <SilhouetteImageLayer
                v-for="instance in instances"
                :key="instance.id"
                :src="instance.src"
                @loaded="onLoad(instance.id)" />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
    import SilhouetteImageLayer from '@/components/imageViewer/SilhouetteImageLayer.vue';

    interface Props {
        src?: string
    }

    const emit = defineEmits<{
        imageLoaded: []
    }>();

    const props = withDefaults(defineProps<Props>(), {
        src: '',
    });

    let idCounter = 0;

    const instances = ref<Array<{ id: number; src: string }>>([
        { id: idCounter++, src: props.src },
    ]);

    // ID of the most recently requested image. The old layer is only retired
    // once this image has loaded, so the leave transition starts at the same
    // moment as the new image's load-driven fade-in — a true crossfade.
    let pendingId: number | null = null;

    function onLoad(id: number) {
        if (id === pendingId) {
            pendingId = null;
            // Retiring old instances triggers their TransitionGroup leave at the
            // exact moment the new child's image becomes visible — true crossfade.
            instances.value = instances.value.filter(i => i.id === id);
        }

        emit('imageLoaded');
    }

    watch(
        () => props.src,
        (newSrc) => {
            if (!newSrc) return;
            const newId = idCounter++;
            pendingId = newId;
            instances.value.push({ id: newId, src: newSrc });
        },
    );
</script>

<style lang="scss" scoped>
$duration: 2000ms;

.image-container {
    height: 100%;
    left: 0;
    pointer-events: none;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 2;
}

.image-stage {
    height: 100%;
    position: relative;
    width: 100%;
}

// Leave transition applied to the entire SilhouetteImageLayer root (image + shadow as a unit).
// Entry is handled by the child's own load-driven fade-in.
.image-swap-leave-active {
    transition: opacity $duration ease, filter $duration ease;
    z-index: 2;
}

.image-swap-leave-from {
    filter: blur(0px);
    opacity: 1;
}

.image-swap-leave-to {
    filter: blur(16px);
    opacity: 0;
}
</style>
