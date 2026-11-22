# DESIGN.md: hiisumit.com

## 1. Visual theme and atmosphere
"Android Forest". A night-forest dark theme and a morning-forest light theme. The person's name is set as a monument; Android green is used only where you can act. Calm and premium, never "hacker neon".
The structure and motion follow Rahulraikwar17/Portfolio. The clichés are removed: no neon glow, no monospace labels, no glass pill nav and no 01/02 numbering.

## 2. Colour palette and roles
All colours are tokens on `:root`, overridden under `:root[data-theme="light"]`.

| Role | Dark | Light | Use |
|---|---|---|---|
| `--bg` | #07120C | #EEF5EF | page ground |
| `--surface` | #0E1F15 | #E1ECE3 | panels, stat blocks, marquee band |
| `--surface-2` | #14291D | #D2E2D6 | second tone step, ghost buttons |
| `--ink` | #E6F4EA | #0A1F13 | all running text |
| `--muted` | #8DAF98 | #4A6754 | secondary text only |
| `--accent` | #3DDC84 | #3DDC84 | filled actions (Android green) |
| `--accent-ink` | #3DDC84 | #0E8A4A | accent used as text or stroke |
| `--hot` | #B8F5CF | #0B6B39 | experience metrics, pulse heads |
| `--silk-low/high/spec` | per theme | per theme | WebGL silk shader colours |

App screens (`[data-ui]`) carry each app's own Material 3 scheme, in light and dark: ResQSync is blue, Neer is water blue and NewsHub is coral.

## 3. Typography
- Display: **Unbounded** 500/700/800, used for the name, headings, metrics, marquee and footer wordmark. Tracking is -0.02 to -0.05em and leading 0.86 to 0.95.
- Text: **Space Grotesk** 400/500/600, at 18px with 1.55 leading for body and 15px for small text.
- App screens: **Roboto Flex**, inside the drawn Android UI only.
- Steps: monument (fitted by JS), h2 `clamp(44px, 7.4vw, 120px)`, statement `clamp(24px, 2.5vw, 36px)`, body 18px, small 15px.

## 4. Components
- **Buttons:** full pill shape, 50px tall (44px minimum).
  - `.btn--accent`: hover → `--hot`.
  - `.btn--ghost`: surface-2, hover → ink.
  - `.btn--dark`: used on the footer.
  - All buttons press to scale(.97) and use a 2px accent focus ring.
- **Theme toggle:** 44px round button. The sun and moon morph by animating the circle radius, the mask bite and the rays. The theme switch is a View Transitions circle reveal from the button; where that API is missing it falls back to a 0.5s colour fade.
- **Contact rows:** alternating surface bands. On hover an accent fill wipes up and the value text swaps for the action text.
- **Phones:** a #0B0F0D bezel cropped at the bottom of a surface panel, with drawn Material 3 screens inside.

## 5. Layout
- **Grid:** max width 1600px, gutter `clamp(16px, 2.4vw, 32px)`, sections `clamp(120px, 14vw, 220px)` apart.
- **Section order:** Hero (sticky, covered by About) → About → Experience → Projects (sticky silk background and heading) → Skills (orbit and trees) → Contact → inverted footer with the full-width name.

## 6. Depth
No shadows on elements at rest. Surfaces are separated by tone steps. The only shadow is the floating chip in the ResQSync UI.

## 7. Motion (L3)
- **Libraries:** GSAP 3.13 (ScrollTrigger, SplitText) and Lenis 1.3.4.
- **Load and hero:**
  - loader: first visit per session only, under about 1s
  - hero letters rise and the photo clip opens
  - the hero recedes as About covers it
- **Scroll-driven effects:**
  - mouse-lit WebGL silk in the hero and projects, paused when off-screen
  - masked company and project titles reveal on scroll
  - About copy brightens word by word, tied to scroll
  - counters count up when they enter view
  - velocity marquee with skew
  - scroll squeeze on desktop
- **Interactive effects:**
  - outline words react to cursor proximity
  - skills orbit stops on hover and shows a detail card
  - skill trees send pulses down their wires
  - particle "LET'S TALK" assembles and repels the cursor
  - magnetic CTA, square-trail cursor on fine pointers
  - the Neer phone is live
- **Reduced motion:** a static hero, a single silk frame, assembled particles and no travel.

## 8. Do's and don'ts
- Do keep running text in full ink. Do keep accent fills for actions.
- Do keep every headline to two lines or fewer.
- Don't use gradients, except the neutral hero scrim. Don't use glows, monospace, eyebrow labels or 01/02 numbering.
- Don't use rows of identical icon cards, or thin hairline rules as dividers.
- Don't add a third typeface outside the app screens.
- Don't hide content behind a script: every reveal starts from a state the browser can paint without JS.

## 9. Responsive
- **≤900px:** burger menu with a circular clip reveal; project and role grids stack; the side phone is hidden.
- **≤760px:** the hero is no longer sticky; the name, photo and active role stack; CTAs go full width.
- **≤640px:** skills are one column; contact rows stack label over value.
- Touch targets are 44px or larger. There is no custom cursor, squeeze or proximity effect on touch devices.
