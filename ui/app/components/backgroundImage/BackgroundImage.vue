<template>
    <div class="image-container">
        <img
            v-if="src"
            :src="src" class="background-image" />
    </div>
</template>
<script setup>
    defineProps({
        src: {
            type: String,
            required: true,
        },
    });
</script>
<style lang="scss" scoped>
.image-container {
    display: flex;
    height: 100%;
    left: 0;
    overflow: hidden;
    position: fixed;
    top: 0;
    width: 100%;

    img {
        height: 100%;
        object-fit: cover;
        width: 100%;
        z-index: -1;
    }
}
</style>
