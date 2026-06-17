# Design

## Visual Theme
Premium financial terminal by default, utilizing a deep-dark high-contrast palette. Also supports a clean light mode. Focus is on clear information layout and smooth, modern typography.

## Typography
- **Base font size**: 17px (mobile) / 18px (tablet) / 18.5px (desktop) to scale relative typography.
- **Display font**: IBM Plex Sans Thai (for Thai headings) / Outfit (for English display/numbers).
- **Body font**: IBM Plex Sans Thai (for Thai body text) / system-ui.
- **Monospace**: IBM Plex Mono (for numerical data and tables).
- **Hierarchy ratio**: 1.25x scale steps.
- **Text wrap**: `balance` for display headings (h1-h3), `pretty` for paragraphs.

## Color Palette
Using CSS variables defining RGB channels for easy opacity manipulation:
- **`--bg`**: `8 12 20` (Dark) / `247 248 250` (Light) - Main body background.
- **`--surface`**: `14 20 32` (Dark) / `255 255 255` (Light) - Card & container backgrounds.
- **`--elevate`**: `20 28 42` (Dark) / `255 255 255` (Light) - Elevated elements and dropdowns.
- **`--line`**: `38 48 66` (Dark) / `226 230 238` (Light) - Border lines and grid lines.
- **`--ink`**: `232 238 248` (Dark) / `16 24 38` (Light) - Primary text.
- **`--muted`**: `138 150 170` (Dark) / `96 108 128` (Light) - Secondary/muted text.
- **`--brand`**: `52 211 153` (Dark) / `13 148 102` (Light) - Mint/Emerald accent representing "value".
- **`--brand-soft`**: `16 52 44` (Dark) / `224 244 236` (Light) - Subtle background tint.
- **`--gold`**: `232 188 96` (Dark) / `176 128 28` (Light) - Premium features accent.
- **`--up`**: Same as brand (positive margin of safety / upward price move).
- **`--down`**: `248 113 113` (Dark) / `220 64 64` (Light) - Negative safety margin / downward move.

## Components & Styles
- **Buttons**: Rounded-xl borders with active state transitions. Uses `.button-brand` and `.button-outline`.
- **Cards**: `.surface` class applying `border` and `background-color`.
- **Inputs**: `.input-base` applying borders, focus states, and transitions.
- **Marquee**: Custom CSS animation `.animate-marquee` for scrolling ticker symbols.

## Layout & Rhythm
- **Grid spacing**: Consistent `gap-4` or `gap-6` depending on container.
- **Responsive strategy**: Flexbox with `flex-wrap` and mobile-first styles (`md:block`, `lg:col-span-8`, etc.).
- **z-index scale**: Dropdowns (absolute) -> modals (backdrop & window) -> toasts.
