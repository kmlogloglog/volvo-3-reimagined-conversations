<template>
    <ClientOnly>
        <nav class="navigation">
            <NavigationBarFoldOut
                :options="foldOutOptions"
                direction="up-right"
                @select="handleFoldOutSelect" />
            <NavigationBarAudioButton
                :disabled="isBusy"
                :is-recording="isAudioRecording"
                :loading="isBusy && isAudioRecording"
                @[EMITS.RECORD_CLICK]="handleMicrophoneClick" />
        </nav>
    </ClientOnly>
</template>

<script setup>
    import NavigationBarAudioButton from '@/components/navigation/NavigationBarAudioButton.vue';
    import NavigationBarFoldOut from '@/components/navigation/NavigationBarFoldout.vue';
    import { useAgentStore } from '@/stores/agent';
    import { ROUTE } from '@/constants/route';
    import { EMITS } from '@/constants/emits.js';
    import { BUS } from '@/constants/bus.js';
    import { useEventBus } from '@vueuse/core';
    import { storeToRefs } from 'pinia';

    const emits = defineEmits([EMITS.RECORD_CLICK, EMITS.CHAT_CLICK, EMITS.CAMERA_CLICK]);

    const busMicrophone = useEventBus(BUS.MICROPHONE);
    const busConnection = useEventBus(BUS.AGENT_CONNECTION);

    const connected = ref(false);
    const connecting = ref(false);
    const micRequesting = ref(false);
    const micDenied = ref(false);
    const isAudioRecording = ref(false);
    const isChatActive = ref(false);
    const isCameraActive = ref(false);

    const isBusy = computed(() => connecting.value || micRequesting.value);

    const foldOutOptions = computed(() => [
        {
            id: ROUTE.CHAT.id,
            label: ROUTE.CHAT.label,
            icon: ROUTE.CHAT.icon,
            active: isChatActive.value,
        },
        {
            id: ROUTE.CAMERA.id,
            label: ROUTE.CAMERA.label,
            icon: ROUTE.CAMERA.icon,
            disabled: true,
        },
    ]);

    onMounted(() => {
        const agentStore = useAgentStore();
        const { listening } = storeToRefs(agentStore);

        watch(listening, (val) => {
            isAudioRecording.value = val;
        });
    });

    function handleFoldOutSelect(option) {
        if (option.id === ROUTE.CHAT.id) {
            isChatActive.value = !isChatActive.value;
            emits(EMITS.CHAT_CLICK, isChatActive.value);
        } else if (option.id === ROUTE.CAMERA.id) {
            isCameraActive.value = !isCameraActive.value;
            emits(EMITS.CAMERA_CLICK, isCameraActive.value);
        }
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
