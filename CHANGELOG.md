# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### LG Dryer (RH90V9_WW)

- **Added** minute-accurate decoding for the Delayed Start window. `Bd[11]`
  was previously marked unknown but is the reservation-minutes countdown
  paired with `Bd[10]` (hours). Confirmed against a live capture reporting
  `17h 55m` remaining (`Bd[10]=0x11, Bd[11]=0x37`). `cycle_end_time` and
  `cycle_start_time` now project from the combined `hours*60 + minutes`
  total instead of whole hours only, matching what the LG app displays.
  `Bd[12]/Bd[13]` mirror the same values in observed captures and likely
  carry the originally committed reservation, pending confirmation.
- The `reservation` select still exposes whole hours, matching the LG
  protocol's whole-hour-only set command (`F0 26`).

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
