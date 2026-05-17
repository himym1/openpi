# Decision: Session Map Enhancement Sequence

Status: accepted
Date: 2026-05-17

## Context

Five remaining Session Map features: close button, keyboard nav, branch switching, live tree mutations, and filter/search. Need to choose implementation order and approach for each.

## Decision

Implement in dependency order: (1) close button + Escape key → (2) keyboard navigation → (3) filter/search UI → (4) branch switching via extended getSessionMessages IPC → (5) live tree mutations via Pi SDK event subscription. Each is a self-contained slice that builds on the prior.

## Consequences

+ Each slice verifiable independently. + Close button and keyboard nav share Escape/keydown wiring. - Branch switching and live mutations require IPC/event changes beyond the renderer. - Filter/search depends on the tree having stable node rendering to filter against.

## Evidence

- Recorded through decision_record.
