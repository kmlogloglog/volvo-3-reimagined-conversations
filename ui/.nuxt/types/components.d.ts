
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

interface _GlobalComponents {
  'AudioCaptureCircles': typeof import("../../app/components/audioCapture/AudioCaptureCircles.vue").default
  'AudioCaptureWaves': typeof import("../../app/components/audioCapture/AudioCaptureWaves.vue").default
  'BaseComponentsUiElementsBaseButton': typeof import("../../app/components/baseComponents/uiElements/BaseButton.vue").default
  'BaseComponentsUiElementsBaseChatTextArea': typeof import("../../app/components/baseComponents/uiElements/BaseChatTextArea.vue").default
  'BaseComponentsUiElementsBaseSpeechBubble': typeof import("../../app/components/baseComponents/uiElements/BaseSpeechBubble.vue").default
  'BookingInfoCard': typeof import("../../app/components/booking/BookingInfoCard.vue").default
  'ChatPanel': typeof import("../../app/components/chat/ChatPanel.vue").default
  'ChatSpeechBubble': typeof import("../../app/components/chat/ChatSpeechBubble.vue").default
  'ChatStream': typeof import("../../app/components/chat/ChatStream.vue").default
  'LogoVolvoLogo': typeof import("../../app/components/logo/VolvoLogo.vue").default
  'NavigationBar': typeof import("../../app/components/navigation/NavigationBar.vue").default
  'NavigationBarAudioButton': typeof import("../../app/components/navigation/NavigationBarAudioButton.vue").default
  'NavigationBarButton': typeof import("../../app/components/navigation/NavigationBarButton.vue").default
  'NuxtWelcome': typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default
  'NuxtLayout': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default
  'NuxtErrorBoundary': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
  'ClientOnly': typeof import("../../node_modules/nuxt/dist/app/components/client-only").default
  'DevOnly': typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default
  'ServerPlaceholder': typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default
  'NuxtLink': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default
  'NuxtLoadingIndicator': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
  'NuxtTime': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
  'NuxtRouteAnnouncer': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
  'NuxtImg': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
  'NuxtPicture': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
  'ColorScheme': typeof import("../../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue").default
  'NuxtPage': typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default
  'NoScript': typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript
  'Link': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link
  'Base': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base
  'Title': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title
  'Meta': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta
  'Style': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style
  'Head': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head
  'Html': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html
  'Body': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body
  'NuxtIsland': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default
  'LazyAudioCaptureCircles': LazyComponent<typeof import("../../app/components/audioCapture/AudioCaptureCircles.vue").default>
  'LazyAudioCaptureWaves': LazyComponent<typeof import("../../app/components/audioCapture/AudioCaptureWaves.vue").default>
  'LazyBaseComponentsUiElementsBaseButton': LazyComponent<typeof import("../../app/components/baseComponents/uiElements/BaseButton.vue").default>
  'LazyBaseComponentsUiElementsBaseChatTextArea': LazyComponent<typeof import("../../app/components/baseComponents/uiElements/BaseChatTextArea.vue").default>
  'LazyBaseComponentsUiElementsBaseSpeechBubble': LazyComponent<typeof import("../../app/components/baseComponents/uiElements/BaseSpeechBubble.vue").default>
  'LazyBookingInfoCard': LazyComponent<typeof import("../../app/components/booking/BookingInfoCard.vue").default>
  'LazyChatPanel': LazyComponent<typeof import("../../app/components/chat/ChatPanel.vue").default>
  'LazyChatSpeechBubble': LazyComponent<typeof import("../../app/components/chat/ChatSpeechBubble.vue").default>
  'LazyChatStream': LazyComponent<typeof import("../../app/components/chat/ChatStream.vue").default>
  'LazyLogoVolvoLogo': LazyComponent<typeof import("../../app/components/logo/VolvoLogo.vue").default>
  'LazyNavigationBar': LazyComponent<typeof import("../../app/components/navigation/NavigationBar.vue").default>
  'LazyNavigationBarAudioButton': LazyComponent<typeof import("../../app/components/navigation/NavigationBarAudioButton.vue").default>
  'LazyNavigationBarButton': LazyComponent<typeof import("../../app/components/navigation/NavigationBarButton.vue").default>
  'LazyNuxtWelcome': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default>
  'LazyNuxtLayout': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default>
  'LazyNuxtErrorBoundary': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
  'LazyClientOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only").default>
  'LazyDevOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default>
  'LazyServerPlaceholder': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default>
  'LazyNuxtLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default>
  'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
  'LazyNuxtTime': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
  'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
  'LazyNuxtImg': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
  'LazyNuxtPicture': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
  'LazyColorScheme': LazyComponent<typeof import("../../node_modules/@nuxtjs/color-mode/dist/runtime/component.vue").default>
  'LazyNuxtPage': LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default>
  'LazyNoScript': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript>
  'LazyLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link>
  'LazyBase': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base>
  'LazyTitle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title>
  'LazyMeta': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta>
  'LazyStyle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style>
  'LazyHead': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head>
  'LazyHtml': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html>
  'LazyBody': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body>
  'LazyNuxtIsland': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
