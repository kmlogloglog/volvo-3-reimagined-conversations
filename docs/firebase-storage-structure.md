# Firebase Storage Structure

This document describes the recommended folder structure for car images in Firebase Storage. The structure mirrors the `car_assets.json` schema used by the backend tools.

## Folder Layout

```
models/
  {model}/
    silhouette.avif
    exteriors/
      {color_id}/
        {wheel_id}/
          front.avif
          front34.avif
          front34_close.avif
    interiors/
      {interior_id}/
        dashboard.avif
        seat.avif
        upholstery.avif
    wheels/
      {wheel_id}.avif
```

## Conventions

- **Lowercase consistently** — use `ex30`, not `EX30` or `Ex30`.
- **Single root** — all model assets live under `models/`. No separate prefixes like `carousel/`, `configuration/`, `model_selector/`.
- **IDs match `car_configurations.json`** — interior folder names use the full config key (e.g., `wool_blend_breeze/`, not `breeze/`), so the same ID resolves both descriptive data and images without mapping.
- **Flat wheel images** — wheel close-ups are stored as `wheels/{wheel_id}.avif`, not nested under a descriptive folder name.
- **All images use `.avif`** format for optimal compression and quality.

## Example (EX30)

```
models/
  ex30/
    silhouette.avif
    exteriors/
      cloud_blue/
        19_5/
          front.avif
          front34.avif
          front34_close.avif
        20_5/
          front.avif
          front34.avif
          front34_close.avif
        20_5y/
          front.avif
          front34.avif
          front34_close.avif
      crystal_white/
        19_5/
          ...
      onyx_black/
        ...
      vapour_grey/
        ...
      sand_dune/
        ...
    interiors/
      wool_blend_breeze/
        dashboard.avif
        seat.avif
        upholstery.avif
      wool_blend_indigo/
        dashboard.avif
        seat.avif
        upholstery.avif
      wool_blend_mist/
        ...
      wool_blend_pine/
        ...
    wheels/
      19_5.avif
      20_5.avif
      20_5y.avif
```

## Mapping to `car_assets.json`

The JSON structure directly reflects the storage paths:

| JSON path | Storage path |
|-----------|-------------|
| `{model}.silhouette` | `models/{model}/silhouette.avif` |
| `{model}.exteriors.{color}.wheels.{wheel}.front34` | `models/{model}/exteriors/{color}/{wheel}/front34.avif` |
| `{model}.interiors.{interior}.dashboard` | `models/{model}/interiors/{interior}/dashboard.avif` |
| `{model}.interiors.{interior}.upholstery` | `models/{model}/interiors/{interior}/upholstery.avif` |
| `{model}.wheels.{wheel}` | `models/{model}/wheels/{wheel}.avif` |

## Notes

- **Exterior images are keyed by color + wheel** because the car's appearance changes with both. Each color/wheel combination has 3 views.
- **Interior dashboard/seat images are shared** across upholstery variants of the same color (e.g., `nordico_charcoal` and `ventilated_nordico_charcoal` point to the same dashboard/seat photos). The `car_assets.json` handles this many-to-one mapping by duplicating the references.
- **Upholstery images are unique** per interior option — they show the material close-up which differs between ventilated and non-ventilated variants.
- **Gradient stops** are not stored as images — they are RGBA color values stored directly in `car_assets.json` under `exteriors.{color}.gradient_stops`.
