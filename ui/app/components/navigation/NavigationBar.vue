<template>
    <ClientOnly>
        <Teleport to="body">
            <Transition name="alert-drop">
                <div
                    v-if="micDenied"
                    class="mic-access-alert"
                    role="alert">
                    <span class="mic-access-alert-icon icon-microphone"></span>
                    <span class="mic-access-alert-message">Microphone access denied</span>
                </div>
            </Transition>
        </Teleport>

        <nav class="navigation">
            <NavigationBarFoldOut
                :options="foldOutOptions"
                direction="up-right"
                @select="handleFoldOutSelect" />
            <NavigationBarAudioButton
                :disabled="micRequesting"
                :is-recording="isAudioRecording"
                :loading="(connecting  || micRequesting) && isAudioRecording"
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

    const agentStore = useAgentStore();
    const { listening } = storeToRefs(agentStore);

    watch(listening, (val) => {
        isAudioRecording.value = val;
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

.mic-access-alert {
    align-items: center;
    background: #b71c1c;
    border-radius: 9999px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    color: #fff;
    display: inline-flex;
    font-size: 0.875rem;
    font-weight: 500;
    gap: 0.625rem;
    left: 50%;
    padding: 0.75rem 1.25rem;
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 72px);
    transform: translateX(-50%);
    white-space: nowrap;
    z-index: 9999;

    &-icon {
        flex-shrink: 0;
        font-size: 1rem;
        line-height: 0;
        opacity: 0.9;
    }
}

.alert-drop-enter-active,
.alert-drop-leave-active {
    transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-drop-enter-from,
.alert-drop-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-0.5rem);
}

.alert-drop-enter-to,
.alert-drop-leave-from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}
</style>
