/**
 * Static city-to-coordinates lookup for map plotting.
 * Values are [longitude, latitude] pairs.
 */

const CITY_COORDS: Record<string, [number, number]> = {
  // Scandinavia
  'malmö':        [13.0038, 55.6050],
  'malmo':        [13.0038, 55.6050],
  'stockholm':    [18.0686, 59.3293],
  'gothenburg':   [11.9746, 57.7089],
  'göteborg':     [11.9746, 57.7089],
  'oslo':         [10.7522, 59.9139],
  'copenhagen':   [12.5683, 55.6761],
  'helsinki':      [24.9384, 60.1699],
  'bergen':       [5.3221, 60.3913],
  'uppsala':      [17.6389, 59.8586],
  'linköping':    [15.6214, 58.4108],
  'linkoping':    [15.6214, 58.4108],
  'västerås':     [16.5448, 59.6099],

  // Europe
  'london':       [-0.1278, 51.5074],
  'paris':        [2.3522, 48.8566],
  'berlin':       [13.4050, 52.5200],
  'munich':       [11.5820, 48.1351],
  'amsterdam':    [4.9041, 52.3676],
  'brussels':     [4.3517, 50.8503],
  'zurich':       [8.5417, 47.3769],
  'vienna':       [16.3738, 48.2082],
  'madrid':       [-3.7038, 40.4168],
  'barcelona':    [2.1734, 41.3851],
  'rome':         [12.4964, 41.9028],
  'milan':        [9.1900, 45.4642],
  'lisbon':       [-9.1393, 38.7223],
  'dublin':       [-6.2603, 53.3498],
  'prague':       [14.4378, 50.0755],
  'warsaw':       [21.0122, 52.2297],

  // North America
  'new york':     [-74.0060, 40.7128],
  'nyc':          [-74.0060, 40.7128],
  'los angeles':  [-118.2437, 34.0522],
  'chicago':      [-87.6298, 41.8781],
  'san francisco':[-122.4194, 37.7749],
  'toronto':      [-79.3832, 43.6532],
  'vancouver':    [-123.1216, 49.2827],
  'miami':        [-80.1918, 25.7617],
  'seattle':      [-122.3321, 47.6062],
  'boston':        [-71.0589, 42.3601],
  'washington':   [-77.0369, 38.9072],
  'dallas':       [-96.7970, 32.7767],
  'houston':      [-95.3698, 29.7604],
  'atlanta':      [-84.3880, 33.7490],
  'denver':       [-104.9903, 39.7392],
  'austin':       [-97.7431, 30.2672],

  // Asia-Pacific
  'tokyo':        [139.6917, 35.6895],
  'shanghai':     [121.4737, 31.2304],
  'beijing':      [116.4074, 39.9042],
  'singapore':    [103.8198, 1.3521],
  'sydney':       [151.2093, -33.8688],
  'melbourne':    [144.9631, -37.8136],
  'dubai':        [55.2708, 25.2048],
  'mumbai':       [72.8777, 19.0760],
  'seoul':        [126.9780, 37.5665],

  // South America
  'são paulo':    [-46.6333, -23.5505],
  'sao paulo':    [-46.6333, -23.5505],
  'buenos aires': [-58.3816, -34.6037],
};

/**
 * Look up coordinates for a city name (case-insensitive).
 * Returns [longitude, latitude] or null if not found.
 */
export function getCityCoords(city: string): [number, number] | null {
  return CITY_COORDS[city.toLowerCase().trim()] ?? null;
}
