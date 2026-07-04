# Changelog

## [1.1.1] — 2026-07-04

### Added

- LG Fridge (`2REF11EBIVPC4`) support with unit tests.
- LG A/C alias `RAC_0B0001_WW` mapped to the existing `RAC_056905_WW`
  driver.

### Fixed

- Management UI now works behind a reverse proxy at any subpath — asset
  URLs are resolved relative to the page instead of hard-coded to `/`.

### LG Dryer (RH90V9_WW)

- **Added** 5-minute F0 ED poll so HA never holds stale state after a
  reconnect or a quiet period. The dryer only emits state in response to
  a poll or an internal state change, so without this HA could freeze on
  the last known values indefinitely.
- **Changed** `cycle_start_time` and `cycle_end_time` are pegged to the
  minute, using rounding (not floor) so successive packets within a
  minute don't flip the projected end back and forth by ±1 min. HA's
  relative-time display now ticks predictably.
- **Changed** cleared sensor values now publish `"None"` (rendered as
  "Unknown" in HA) instead of `"-"` or empty string: `error_message`,
  `cycle_duration`, `cycle_start_time`, `cycle_end_time`. `process_state`
  publishes `"Off"` when the dryer is off (semantically accurate vs
  unknown).
- **Fixed** `cycle_start_time` was never republished when a cycle ended,
  so HA kept showing the previous cycle's start time indefinitely. Now
  cleared alongside `cycle_end_time` and `cycle_duration`.
- **Fixed** `cycle_start_time` is now inferred from
  `initial_time − remaining_time` on the first Running packet, so a
  mid-cycle add-on restart shows the actual start time instead of
  resetting to "now".

## [1.1.0] — 2026-06-28

### ⚠️ Breaking — upgrade procedure

Entity layout for the LG Dryer (RH90V9_WW) changed in this release. The
add-on update alone will not clean up the orphaned `Delayed end` sensor
because its MQTT Discovery message is retained on the broker. To get a
clean layout:

1. **Update the Rethink add-on** to 1.1.0 (Settings → Add-ons → Rethink
   → Update). The supervisor will restart the add-on on the new image.
2. **Stop the Rethink add-on.**
3. **Delete the dryer device from Home Assistant's MQTT integration**
   (Settings → Devices & Services → MQTT → device → ⋮ → Delete). This
   clears the retained discovery messages for the removed entities.
4. **Start the Rethink add-on.** It will republish the device with the
   new entity layout. Any automations referencing the removed
   `sensor.<...>_delayed_end` must be updated to use `run_state ==
"Delayed Start"` and/or `cycle_end_time` instead.

(A native HA integration would handle this transparently — see the
project README for context.)

### LG Dryer (RH90V9_WW)

- **Added** minute-accurate decoding for the Delayed Start window. `Bd[11]`
  was previously marked unknown but is the reservation-minutes countdown
  paired with `Bd[10]` (hours). Confirmed against a live capture reporting
  `17h 55m` remaining (`Bd[10]=0x11, Bd[11]=0x37`). `cycle_end_time` and
  `cycle_start_time` now project from the combined `hours*60 + minutes`
  total instead of whole hours only, matching what the LG app displays.
  `Bd[12]/Bd[13]` mirror the same values in observed captures and likely
  carry the originally committed reservation, pending confirmation.
- **Removed** the `reservation` (`Delayed end`) sensor. It was read-only,
  whole-hour granularity (`"18h"` while the dryer was at `17h 55m`), and
  fully redundant with `run_state == "Delayed Start"` (the on/off signal)
  and `cycle_end_time` (the minute-accurate timestamp). The `RESERVATION`
  map is retained internally — the `start` button's JSON payload still
  accepts `reservation: "4h"` for setting the delay at cycle launch.

## [1.0.4] — 2026-06-27

### LG Dryer (RH90V9_WW)

- **Added** `Delayed Start` as a distinct `run_state` value. Previously the LG
  firmware reports `Bd[0] = Running` throughout the reservation (delayed-end)
  countdown, even though the drum is idle and no power is being drawn.
  `run_state` now publishes `Delayed Start` whenever the dryer is in that wait
  window, so consumers (automations, energy schedulers, dashboards) can
  distinguish "committed but waiting" from "actually drying".
- **Changed** `cycle_start_time` / `cycle_end_time` / `cycle_duration`
  publication to reflect the delayed phase:
    - `cycle_end_time` = `now + reservation_hours` (the dryer's projected end).
    - `cycle_start_time` = `cycle_end_time − initial_time` (cycle duration).
    - `cycle_duration` stays at `0` until the drum actually starts.
    - When the reservation expires and the dryer transitions to real running,
      the existing logic takes over (measured start time, live duration).
