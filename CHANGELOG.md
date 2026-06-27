# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
