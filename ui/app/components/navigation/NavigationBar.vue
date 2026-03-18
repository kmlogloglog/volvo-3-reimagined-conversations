<template>
    <ClientOnly>
        <Teleport to="body">
            <Transition name="alert-drop">
                <div
                    v-if="micDenied"
                    class="mic-access-alert"
                    role="alert">
                    <span class="mic-access-alert-title">Microphone access denied</span>
                    <span class="mic-access-alert-hint">Allow microphone access in your browser's site settings</span>
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

<script setup lang="ts">
    import type { FoldoutOption } from '@/types/ui';
    import type { ConnectionBusPayload, MicrophoneBusPayload } from '@/types/bus';
    import NavigationBarAudioButton from '@/components/navigation/NavigationBarAudioButton.vue';
    import NavigationBarFoldOut from '@/components/navigation/NavigationBarFoldout.vue';
    import { useAgentStore } from '@/stores/agent';
    import { ROUTE } from '@/constants/route';
    import { EMITS } from '@/constants/emits';
    import { BUS } from '@/constants/bus';
    import { useEventBus } from '@vueuse/core';
    import { storeToRefs } from 'pinia';

    const emits = defineEmits<{
        recordClick: [enabled: boolean]
        chatClick: [enabled: boolean]
        cameraClick: [enabled: boolean]
    }>();

    const busMicrophone = useEventBus<MicrophoneBusPayload>(BUS.MICROPHONE);
    const busConnection = useEventBus<ConnectionBusPayload>(BUS.AGENT_CONNECTION);

    const connected = ref(false);
    const connecting = ref(false);
    const micRequesting = ref(false);
    const micDenied = ref(false);
    const isAudioRecording = ref(false);
    const isChatActive = ref(false);
    const isCameraActive = ref(false);

    const foldOutOptions = computed<FoldoutOption[]>(() => [
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

    function handleFoldOutSelect(option: FoldoutOption) {
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
    background: #b71c1c;
    border-radius: 14px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    left: 50%;
    max-width: calc(100% - 2.5rem);
    padding: 0.875rem 1.125rem;
    position: fixed;
    right: unset;
    text-align: center;
    top: calc(env(safe-area-inset-top, 0px) + 72px);
    transform: translateX(-50%);
    width: max-content;
    z-index: 9999;

    &-title {
        font-size: 0.875rem;
        font-weight: 600;
        line-height: 1.3;
    }

    &-hint {
        font-size: 0.75rem;
        font-weight: 400;
        opacity: 0.8;
        line-height: 1.4;
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
