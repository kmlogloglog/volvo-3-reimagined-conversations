import { useColorMode, ref, computed, onMounted } from '#imports';

export function useBackground(appStore = null) {
    const colorMode = useColorMode();
    const isMounted = ref(false);

    onMounted(() => {
        isMounted.value = true;
    });

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        } : { r: 0, g: 0, b: 0 };
    }

    function getCssVar(varName) {
        if (import.meta.server) return '';
        return getComputedStyle(document.documentElement)
            .getPropertyValue(varName)
            .trim();
    }

    const gradientStops = computed(() => {
        if (!isMounted.value) {
            return [];
        }

        void colorMode.value;

        const topColor = hexToRgb(getCssVar('--color-background-solid-top'));
        const middleTopColor = hexToRgb(getCssVar('--color-background-solid-middle-top'));
        const middleMiddleColor = hexToRgb(getCssVar('--color-background-solid-middle-middle'));
        const middleBottomColor = hexToRgb(getCssVar('--color-background-solid-middle-bottom'));
        const bottomColor = hexToRgb(getCssVar('--color-background-solid-bottom'));

        // Adjusted positions - lighter colors appear sooner
        return [
            { position: 0, ...topColor, a: 1 },
            { position: 25, ...middleTopColor, a: 1 },
            { position: 45, ...middleMiddleColor, a: 1 },
            { position: 70, ...middleBottomColor, a: 1 },
            { position: 100, ...bottomColor, a: 1 },
        ];
    });

    const backgroundStyle = computed(() => {
        const stops = gradientStops.value;

        const makeStops = (stopsArray) => stopsArray
            .map(stop => `rgba(${stop.r}, ${stop.g}, ${stop.b}, ${stop.a}) ${stop.position}%`)
            .join(', ');

        // Main gradient
        const mainGradient = `radial-gradient(circle farthest-corner at 50% 0%, ${makeStops(stops)})`;

        // Offset gradients - reduced opacity and tighter spread
        const offsetStops1 = stops.map((stop, i) => ({
            ...stop,
            a: i < 2 ? 0.55 : 0,
            position: stop.position * 0.85,
        }));

        const offsetStops2 = stops.map((stop, i) => ({
            ...stop,
            a: i < 2 ? 0.45 : 0,
            position: stop.position * 0.8,
        }));

        const offsetStops3 = stops.map((stop, i) => ({
            ...stop,
            a: i < 2 ? 0.35 : 0,
            position: stop.position * 0.75,
        }));

        const offsetGradient1 = `radial-gradient(circle farthest-corner at 10% -20%, ${makeStops(offsetStops1)})`;
        const offsetGradient2 = `radial-gradient(circle farthest-corner at 90% -20%, ${makeStops(offsetStops1)})`;
        const offsetGradient3 = `radial-gradient(circle farthest-corner at 0% 18%, ${makeStops(offsetStops2)})`;
        const offsetGradient4 = `radial-gradient(circle farthest-corner at 100% 18%, ${makeStops(offsetStops2)})`;
        const offsetGradient5 = `radial-gradient(circle farthest-corner at 30% 8%, ${makeStops(offsetStops3)})`;
        const offsetGradient6 = `radial-gradient(circle farthest-corner at 70% 8%, ${makeStops(offsetStops3)})`;

        const combinedGradient = `${offsetGradient1}, ${offsetGradient2}, ${offsetGradient3}, ${offsetGradient4}, ${offsetGradient5}, ${offsetGradient6}, ${mainGradient}`;

        const backgroundImageUrl = appStore && appStore.backgroundImageUrl;

        if (backgroundImageUrl) {
            return {
                backgroundAttachment: 'fixed',
                backgroundImage: `url(${backgroundImageUrl}), ${combinedGradient}`,
                backgroundPosition: `center bottom, ${'center, '.repeat(6)}center`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: `cover, ${'100% 100%, '.repeat(6)}100% 100%`,
            };
        }

        return {
            background: combinedGradient,
            backgroundAttachment: 'fixed',
        };
    });

    return {
        backgroundStyle,
    };
}
