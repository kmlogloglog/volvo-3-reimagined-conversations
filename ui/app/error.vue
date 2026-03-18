<template>
    <div id="error">
        <div class="app-screen">
            <div class="content">
                <h1 class="text-center">{{ error.statusCode }}</h1>
                <p class="text-center">{{ error.statusCode === 404 ? 'Page not found' : error.message }}</p>
                <BaseButton
                    class="mt-20"
                    label="Go to Home"
                    @click="handleError" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import type { NuxtError } from '#app';
    import { useError, clearError } from '#app';
    import BaseButton from './components/baseComponents/uiElements/BaseButton.vue';

    const error = useError() as Ref<NuxtError>;

    function handleError() {
        clearError({ redirect: '/' });
    }
</script>

<style scoped lang="scss">
#error {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    max-width: 100vw;
    overflow: hidden;
    width: 100%;
}

.app-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    padding-top: env(safe-area-inset-top, 0px);
    justify-content: center;
    align-items: center;

    .content {
        padding: 1rem;
    }
}
</style>
