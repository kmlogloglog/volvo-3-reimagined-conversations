/**
 * Composable for testing different audio capture circle colors
 * This is temporary testing functionality that can be easily removed
 */
export function useColorTesting() {
    // Default gold color
    const circleColors = ref({
        light: { r: 191, g: 154, b: 103 },
        dark: { r: 191, g: 154, b: 103 },
    });

    // Color palette for testing
    const colorPalette = [
        { light: { r: 191, g: 154, b: 103 }, dark: { r: 191, g: 154, b: 103 } }, // Original gold
        { light: { r: 255, g: 100, b: 100 }, dark: { r: 200, g: 80, b: 80 } },   // Red
        { light: { r: 100, g: 100, b: 255 }, dark: { r: 80, g: 80, b: 200 } },   // Blue
        { light: { r: 255, g: 255, b: 100 }, dark: { r: 200, g: 200, b: 80 } },  // Yellow
        { light: { r: 255, g: 100, b: 255 }, dark: { r: 200, g: 80, b: 200 } },  // Magenta
    ];

    let colorIndex = 0;
    let colorInterval = null;

    function updateCircleColors() {
        colorIndex = (colorIndex + 1) % colorPalette.length;
        circleColors.value = { ...colorPalette[colorIndex] };
    }

    onMounted(() => {
        // Start color testing interval (client-side only)
        if (import.meta.client) {
            colorInterval = setInterval(updateCircleColors, 10000);
        }
    });

    onUnmounted(() => {
        // Clean up interval
        if (colorInterval) {
            clearInterval(colorInterval);
        }
    });

    return {
        circleColors,
    };
}
