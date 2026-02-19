<template>
    <ClientOnly>
        <nav class="navigation">
            <NavigationBarButton
                :active="isChatActive"
                :disabled="isBusy"
                :loading="connecting && !isAudioRecording"
                @click="handleChatClick">
                <span :class="isChatActive ? `${ROUTE.CHAT.icon}-fill` : ROUTE.CHAT.icon" ></span>
            </NavigationBarButton>
            <NavigationBarAudioButton
                :disabled="isBusy"
                :is-recording="isAudioRecording"
                :loading="isBusy && isAudioRecording"
                @[EMITS.RECORD_CLICK]="handleMicrophoneClick" />
        </nav>
    </ClientOnly>
</template>

<script setup>
    import NavigationBarButton from './NavigationBarButton.vue';
    import NavigationBarAudioButton from './NavigationBarAudioButton.vue';
    import { ROUTE } from '@/constants/route';
    import { EMITS } from '@/constants/emits.js';
    import { BUS } from '@/constants/bus.js';
    import { useEventBus } from '@vueuse/core';

    const emits = defineEmits([EMITS.RECORD_CLICK, EMITS.CHAT_CLICK]);

    const busMicrophone = useEventBus(BUS.MICROPHONE);
    const busConnection = useEventBus(BUS.AGENT_CONNECTION);

    const connected = ref(false);
    const connecting = ref(false);
    const micRequesting = ref(false);
    const micDenied = ref(false);
    const isAudioRecording = ref(false);
    const isChatActive = ref(false);

    const isBusy = computed(() => connecting.value || micRequesting.value);

    async function handleChatClick() {
        isChatActive.value = !isChatActive.value;

        if (isChatActive.value && isAudioRecording.value) {
            isAudioRecording.value = false;
            await nextTick();
            emits(EMITS.RECORD_CLICK, false);
        }

        emits(EMITS.CHAT_CLICK, isChatActive.value);
    }

    async function handleMicrophoneClick() {
        if (micDenied.value) return;

        isAudioRecording.value = !isAudioRecording.value;
        await nextTick();
        emits(EMITS.RECORD_CLICK, isAudioRecording.value);
    }

    busConnection.on((payload) => {
        connected.value = payload.connected ?? connected.value;
        connecting.value = payload.connecting ?? connecting.value;

        isAudioRecording.value = connected.value;
    });

    busMicrophone.on((payload) => {
        micRequesting.value = payload.requesting ?? micRequesting.value;

        if (payload.denied) {
            micDenied.value = true;
            isAudioRecording.value = false;
        }

        if (payload.granted) {
            micDenied.value = false;
        }
    });
</script>

<style lang="scss" scoped>
.navigation {
    display: flex;
    justify-content: space-between;
    padding: 0 1.875rem 1.25rem;
    width: min(100vw, 768px);
    z-index: 99;
}
</style>
