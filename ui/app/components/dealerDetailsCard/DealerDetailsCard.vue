<template>
    <div class="panel-scroll">
        <BaseSpeechBubble
            :align-bubble="AGENT.AGENT"
            :full-width="true">
            <div class="booking-card">
                <div class="booking-content">
                    <h4 class="booking-headline">Your test drive booking:</h4>
                    <div class="booking-container">
                        <div class="booking-list">
                            <div
                                v-if="time"
                                class="booking-item">
                                <span class="booking-icon icon-clock"></span>
                                <span>{{ time }}</span>
                            </div>
                            <div
                                v-if="datePretty"
                                class="booking-item">
                                <span class="booking-icon icon-calendar-1-dot"></span>
                                <span>{{ datePretty }}</span>
                            </div>
                            <div v-if="retailerAddress" class="booking-item">
                                <span class="booking-icon icon-map-pin"></span>
                                <div class="booking-address">
                                    <div class="booking-address-headline">{{ retailerName }}</div>
                                    <div>{{ retailerAddress }}</div>
                                </div>
                            </div>
                        </div>
                        <div ref="mapsContainer" class="booking-map">
                            <img
                                v-if="mapUrl"
                                :height="size.height"
                                :src="mapUrl"
                                :width="size.width"
                                @load="onImageLoad" />
                        </div>
                    </div>
                </div>
            </div>
        </BaseSpeechBubble>
    </div>
</template>

<script setup lang="ts">
    import type { Coordinates } from '@/types/agent';
    import BaseSpeechBubble from '@/components/baseComponents/uiElements/BaseSpeechBubble.vue';
    import { EMITS } from '@/constants/emits';
    import { AGENT } from '@/constants/agent';
    import { useElementSize } from '@vueuse/core';

    interface Props {
        time?: string
        date?: string
        retailerName?: string
        retailerAddress?: string
        retailerCoordinates?: Coordinates
    }

    const props = withDefaults(defineProps<Props>(), {
        time: '',
        date: '',
        retailerName: '',
        retailerAddress: '',
        retailerCoordinates: () => ({ lat: 0, lng: 0 }),
    });

    const emit = defineEmits<{ imageLoaded: [] }>();

    function onImageLoad(event: Event) {
        emit(EMITS.IMAGE_LOADED, (event.target as HTMLImageElement));
    }

    const datePretty = computed(() => {
        if (!props.date) {
            return '';
        }

        // Append a time component to force local-timezone parsing; without it,
        // Date constructor treats YYYY-MM-DD strings as UTC and shifts the date.
        const date = new Date(props.date + 'T00:00:00');

        if (isNaN(date.getTime())) {
            return '';
        }

        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    });

    const mapsContainer = useTemplateRef<HTMLElement>('mapsContainer');
    const { width: containerWidth } = useElementSize(mapsContainer);

    const size = computed(() => ({
        width: containerWidth.value,
        height: Math.round(containerWidth.value / AGENT.GOOGLE_MAPS.RATIO),
    }));

    const { public: { googleMapsApiKey } } = useRuntimeConfig();

    // Builds the Google Maps Static API URL with a custom dark theme and a marker at the retailer location.
    const mapUrl = computed(() => {
        if (!props.retailerCoordinates || !props.retailerCoordinates.lat || !props.retailerCoordinates.lng) {
            return '';
        }

        const markerColor = '0xFFFFFF';
        const styles = [
            '&style=element:geometry%7Ccolor:0x1a1520',
            '&style=element:labels.text.fill%7Ccolor:0x9a9080',
            '&style=element:labels.text.stroke%7Ccolor:0x1a1520',
            '&style=feature:road%7Celement:geometry%7Ccolor:0x4B443F',
            '&style=feature:road.arterial%7Celement:geometry%7Ccolor:0x4B443F',
            '&style=feature:road.highway%7Celement:geometry%7Ccolor:0xA19685',
            '&style=feature:road.highway%7Celement:geometry.stroke%7Ccolor:0x3a3530',
            '&style=feature:road.local%7Celement:geometry%7Ccolor:0x3a3530',
            '&style=feature:poi%7Cvisibility:off',
            '&style=feature:poi.park%7Celement:geometry%7Ccolor:0x542E46%7Cvisibility:on',
            '&style=feature:landscape.natural%7Celement:geometry%7Ccolor:0x512C43',
            '&style=feature:landscape.man_made%7Celement:geometry%7Ccolor:0x7B4D3F',
            '&style=feature:transit%7Celement:geometry%7Ccolor:0x4B443F',
            '&style=feature:water%7Celement:geometry%7Ccolor:0x0d0d18',
        ];

        const url = [
            'https://maps.googleapis.com/maps/api/staticmap',
            `?center=${props.retailerCoordinates.lat},${props.retailerCoordinates.lng}`,
            `&zoom=${AGENT.GOOGLE_MAPS.ZOOM}`,
            `&size=${size.value.width}x${size.value.height}`,
            `&markers=color:${markerColor}%7Csize:large%7C${props.retailerCoordinates.lat},${props.retailerCoordinates.lng}`,
            ...styles,
            `&key=${googleMapsApiKey}`,
        ].join('');

        return url;
    });
</script>

<style lang="scss" scoped>
    @use '@/scss/mixins' as *;

    .panel-scroll {
        @include panel-scroll;
    }

    .booking {
        &-headline {
            font-size: 1.25rem;
            margin-bottom: 1.5rem;
        }

        &-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        &-item {
            color: var(--font-color-secondary);
            display: flex;
            font-size: 1rem;
            gap: 0.75rem;

            span {
                text-box-trim: trim-both;
            }
        }

        &-icon {
            font-size: 1.25rem;
        }

        &-address-headline {
            margin-bottom: 0.5rem;
        }

        &-address {
            line-height: 1.25;
        }

        &-map {
            img {
                display: block;
                width: 100%;
            }
        }

    }
</style>
