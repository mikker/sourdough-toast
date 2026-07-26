# Changelog

## 0.3.0

- **Breaking:** the `Sourdough` class is no longer exported. Boot the single toaster with `boot(options)`; tear it down with `destroy()`.
- Added swipe-to-dismiss.

## 0.2.0

- ESM-only packaging with an `exports` map (deep imports beyond it, e.g. `sourdough-toast/src/...`, no longer resolve).
- Toasts evicted by `maxToasts` are removed permanently instead of lingering.
- Dark theme, borders, a11y (ARIA, keyboard), per-toast `duration`, `toast.dismiss(id)`, safe-area-aware mobile positioning.
