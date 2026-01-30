
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const AudioCaptureCircles: typeof import("../app/components/audioCapture/AudioCaptureCircles.vue").default
export const AudioCaptureWaves: typeof import("../app/components/audioCapture/AudioCaptureWaves.vue").default
export const BaseComponentsUiElementsBaseButton: typeof import("../app/components/baseComponents/uiElements/BaseButton.vue").default
export const BaseComponentsUiElementsBaseChatTextArea: typeof import("../app/components/baseComponents/uiElements/BaseChatTextArea.vue").default
export const BaseComponentsUiElementsBaseSpeechBubble: typeof import("../app/components/baseComponents/uiElements/BaseSpeechBubble.vue").default
export const BookingInfoCard: typeof import("../app/components/booking/BookingInfoCard.vue").default
export const ChatPanel: typeof import("../app/components/chat/ChatPanel.vue").default
export const ChatSpeechBubble: typeof import("../app/components/chat/ChatSpeechBubble.vue").default
export const ChatStream: typeof import("../app/components/chat/ChatStream.vue").default
export const LogoVolvoLogo: typeof import("../app/components/logo/VolvoLogo.vue").default
export const NavigationBar: typeof import("../app/components/navigation/NavigationBar.vue").default
export const NavigationBarAudioButton: typeof import("../app/components/navigation/NavigationBarAudioButton.vue").default
export const NavigationBarButton: typeof import("../app/components/navigation/NavigationBarButton.vue").default
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only").default
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only").default
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
export const ColorScheme: typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue").default
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page").default
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components").Link
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components").Base
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components").Title
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components").Style
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components").Head
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components").Html
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components").Body
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default
export const LazyAudioCaptureCircles: LazyComponent<typeof import("../app/components/audioCapture/AudioCaptureCircles.vue").default>
export const LazyAudioCaptureWaves: LazyComponent<typeof import("../app/components/audioCapture/AudioCaptureWaves.vue").default>
export const LazyBaseComponentsUiElementsBaseButton: LazyComponent<typeof import("../app/components/baseComponents/uiElements/BaseButton.vue").default>
export const LazyBaseComponentsUiElementsBaseChatTextArea: LazyComponent<typeof import("../app/components/baseComponents/uiElements/BaseChatTextArea.vue").default>
export const LazyBaseComponentsUiElementsBaseSpeechBubble: LazyComponent<typeof import("../app/components/baseComponents/uiElements/BaseSpeechBubble.vue").default>
export const LazyBookingInfoCard: LazyComponent<typeof import("../app/components/booking/BookingInfoCard.vue").default>
export const LazyChatPanel: LazyComponent<typeof import("../app/components/chat/ChatPanel.vue").default>
export const LazyChatSpeechBubble: LazyComponent<typeof import("../app/components/chat/ChatSpeechBubble.vue").default>
export const LazyChatStream: LazyComponent<typeof import("../app/components/chat/ChatStream.vue").default>
export const LazyLogoVolvoLogo: LazyComponent<typeof import("../app/components/logo/VolvoLogo.vue").default>
export const LazyNavigationBar: LazyComponent<typeof import("../app/components/navigation/NavigationBar.vue").default>
export const LazyNavigationBarAudioButton: LazyComponent<typeof import("../app/components/navigation/NavigationBarAudioButton.vue").default>
export const LazyNavigationBarButton: LazyComponent<typeof import("../app/components/navigation/NavigationBarButton.vue").default>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only").default>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only").default>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
export const LazyColorScheme: LazyComponent<typeof import("../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue").default>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page").default>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Link>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Base>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Title>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Style>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Head>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Html>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Body>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default>

export const componentNames: string[]
