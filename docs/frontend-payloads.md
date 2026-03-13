# UI Action Payloads

This document describes the UI action payloads that the frontend receives from tool responses. These are the payloads a frontend application needs to handle to render car configuration, retailer, and booking components.

## How Payloads Arrive

UI actions are delivered inside ADK event objects over WebSocket. The relevant path is:

```
event.content.parts[].functionResponse.response.ui_action
```

The frontend should check each `functionResponse` part for a `ui_action` key. If present and `action === "display_component"`, render the component indicated by `component_name`.

## Envelope

All UI actions share this structure:

```jsonc
{
  "action": "display_component",
  "component_name": "<component>",
  "data": { ... }
}
```

---

## Components

### `model`

Displays the car model silhouette after the user selects a model.

```jsonc
{
  "action": "display_component",
  "component_name": "model",
  "data": {
    "images": [
      "https://storage.googleapis.com/.../models/EX90/silhouette.avif"
    ],
    "caption": "Volvo EX90"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `images` | `string[]` | Single-element array with the silhouette image URL |
| `caption` | `string` | Display caption, e.g. `"Volvo EX90"` |

---

### `exterior`

Displays the selected exterior color as a gradient swatch.

```jsonc
{
  "action": "display_component",
  "component_name": "exterior",
  "data": {
    "selected_color": {
      "id": "vapour_grey",
      "display_name": "Vapour Grey",
      "gradient_stops": [
        { "r": 180, "g": 180, "b": 176, "a": 1, "position": 0 },
        { "r": 160, "g": 161, "b": 157, "a": 1, "position": 0.5 },
        { "r": 140, "g": 141, "b": 138, "a": 1, "position": 1 }
      ]
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `selected_color.id` | `string` | Color identifier |
| `selected_color.display_name` | `string` | Human-readable color name |
| `selected_color.gradient_stops` | `object[]` | RGBA gradient stops for rendering a color swatch |
| `gradient_stops[].r` | `number` | Red (0-255) |
| `gradient_stops[].g` | `number` | Green (0-255) |
| `gradient_stops[].b` | `number` | Blue (0-255) |
| `gradient_stops[].a` | `number` | Alpha (0-1), defaults to `1` if missing |
| `gradient_stops[].position` | `number` | Position along the gradient (0-1) |

---

### `interior`

Displays the selected interior with an upholstery close-up image.

```jsonc
{
  "action": "display_component",
  "component_name": "interior",
  "data": {
    "selected_interior": {
      "id": "nordico_charcoal",
      "display_name": "Nordico Charcoal",
      "description": "Sustainable Nordico textile in charcoal tones."
    },
    "images": [
      "https://storage.googleapis.com/.../models/EX90/interiors/nordico_charcoal/upholstery.avif"
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `selected_interior.id` | `string` | Interior identifier |
| `selected_interior.display_name` | `string` | Human-readable name |
| `selected_interior.description` | `string` | Material/style description |
| `images` | `string[]` | Upholstery close-up URL (may be empty if image not found) |

---

### `wheels`

Displays the selected wheel with a close-up image.

```jsonc
{
  "action": "display_component",
  "component_name": "wheels",
  "data": {
    "selected_wheel": {
      "id": "22Y",
      "display_name": "22\" 5-Y-Spoke Black Diamond Cut",
      "description": "22-inch alloy wheels in a 5-Y-spoke design.",
      "dimension": "22\""
    },
    "images": [
      "https://storage.googleapis.com/.../models/EX90/wheels/22Y.avif"
    ]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `selected_wheel.id` | `string` | Wheel identifier |
| `selected_wheel.display_name` | `string` | Human-readable name |
| `selected_wheel.description` | `string` | Wheel description |
| `selected_wheel.dimension` | `string` | Wheel size (e.g. `"22\""`) |
| `images` | `string[]` | Wheel close-up URL (may be empty if image not found) |

---

### `final_configuration`

Displays the complete car configuration as an image carousel (up to 5 images).

```jsonc
{
  "action": "display_component",
  "component_name": "final_configuration",
  "data": {
    "images": [
      "https://storage.googleapis.com/.../exteriors/vapour_grey/22Y/front34.avif",
      "https://storage.googleapis.com/.../exteriors/vapour_grey/22Y/front.avif",
      "https://storage.googleapis.com/.../exteriors/vapour_grey/22Y/front34_close.avif",
      "https://storage.googleapis.com/.../interiors/nordico_charcoal/dashboard.avif",
      "https://storage.googleapis.com/.../interiors/nordico_charcoal/seat.avif"
    ],
    "caption": "Volvo EX90 in vapour_grey with 22Y wheels and nordico_charcoal interior."
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `images` | `string[]` | Up to 5 images in this order: |
| | | 1. Exterior front 3/4 view |
| | | 2. Exterior front view |
| | | 3. Exterior front 3/4 close-up |
| | | 4. Interior dashboard |
| | | 5. Interior seat |
| `caption` | `string` | Summary of the full configuration |

---

### `maps_view`

Displays the nearest Volvo retailer after location lookup.

```jsonc
{
  "action": "display_component",
  "component_name": "maps_view",
  "data": {
    "location": "Milan, Italy",
    "retailer_name": "Volvo Car Italia",
    "address": "Via Example 42, 20100 Milano",
    "retailer_id": "ChIJ...",
    "retailer_lat": 45.4642,
    "retailer_lng": 9.1900
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `location` | `string` | The search query used (city, nation) |
| `retailer_name` | `string` | Name of the retailer |
| `address` | `string` | Street address |
| `retailer_id` | `string` | Google Places ID |
| `retailer_lat` | `number` | Latitude |
| `retailer_lng` | `number` | Longitude |

---

### `test_drive_confirmation`

Displays the booking confirmation after a test drive is successfully booked.

```jsonc
{
  "action": "display_component",
  "component_name": "test_drive_confirmation",
  "data": {
    "user_name": "Mario Rossi",
    "user_email": "mario@example.com",
    "retailer_name": "Volvo Car Italia",
    "retailer_address": "Via Example 42, 20100 Milano",
    "retailer_phone": "+39 02 1234567",
    "date": "2026-03-20",
    "time": "10:00",
    "retailer_location": {
      "lat": 45.4642,
      "lng": 9.1900
    },
    "preferences": {
      "height": "180cm",
      "music": "jazz",
      "light": "warm"
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user_name` | `string` | User's full name |
| `user_email` | `string` | User's email |
| `retailer_name` | `string` | Retailer name |
| `retailer_address` | `string` | Retailer street address |
| `retailer_phone` | `string \| null` | Retailer phone (may be `null`) |
| `date` | `string` | Appointment date (`YYYY-MM-DD`) |
| `time` | `string` | Appointment time (`HH:MM`) |
| `retailer_location.lat` | `number` | Retailer latitude |
| `retailer_location.lng` | `number` | Retailer longitude |
| `preferences.height` | `string \| null` | Seat height adjustment |
| `preferences.music` | `string \| null` | Music preference |
| `preferences.light` | `string \| null` | Ambient light preference |

**Note:** This payload is only sent when the booking succeeds. When the requested slot is unavailable, no `ui_action` is returned — the agent communicates alternatives via text.
