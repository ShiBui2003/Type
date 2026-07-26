# Typeform Visual Clone — Measured Design Spec
Captured read-only from an already-logged-in Typeform admin session (admin.typeform.com),
one form ("New form", id UXLBpVOT, zero questions), its public respondent URL
(form.typeform.com/to/UXLBpVOT), Dashboard, Results, and Settings screens.
All values are real getComputedStyle / CSS-rule reads, not estimates, unless flagged GAP.

---

## 1. TAILWIND CONFIG BLOCK

module.exports = {
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#3C323E',
          soft: '#4C414E',
          muted: '#655D67',
          faint: '#E5E4E5',
        },
        surface: {
          page: '#FAFAFA',
          panel: '#F7F7F8',
          canvas: '#FFFFFF',
        },
        accent: {
          promo: '#177767',
          ai: '#D97757',
        },
        border: {
          DEFAULT: 'rgba(81,76,84,0.15)',
          ring: 'rgba(84,80,88,0.09)',
          ringSm: 'rgba(87,84,91,0.06)',
        },
        backdrop: 'rgba(68,60,71,0.8)',
      },
      fontFamily: {
        ui: ['-apple-system','BlinkMacSystemFont','"Segoe UI"','Roboto','Oxygen','Ubuntu','Cantarell','"Fira Sans"','"Droid Sans"','"Helvetica Neue"','sans-serif'],
        base: ['system-ui','"Segoe UI"','Roboto','Helvetica','Arial','sans-serif','"Apple Color Emoji"','"Segoe UI Emoji"'],
      },
      fontSize: {
        xs: '13px',
        sm: '14px',
        base: '16px',
        lg: '21px',
        xl: '24px',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        ringSm: '0 0 0 2px rgba(87,84,91,0.06)',
        ring: '0 0 0 3px rgba(84,80,88,0.09)',
        aiGlow: '0 40px 80px 0 rgba(217,119,87,0.24), 0 4px 14px 0 rgba(217,119,87,0.24)',
      },
      transitionTimingFunction: {
        tf: 'cubic-bezier(0.55, 0, 0.1, 1)',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      },
      transitionDuration: {
        150: '150ms',
        175: '175ms',
        200: '200ms',
        300: '300ms',
      },
    },
  },
}

---

## 2. CSS CUSTOM PROPERTIES BLOCK

:root {
  /* Color */
  --tf-ink: #3C323E;
  --tf-ink-soft: #4C414E;
  --tf-ink-muted: #655D67;
  --tf-ink-faint: #E5E4E5;

  --tf-surface-page: #FAFAFA;
  --tf-surface-panel: #F7F7F8;
  --tf-surface-canvas: #FFFFFF;

  --tf-accent-promo: #177767;
  --tf-accent-ai: #D97757;

  --tf-border: rgba(81,76,84,0.15);
  --tf-border-ring: rgba(84,80,88,0.09);
  --tf-border-ring-sm: rgba(87,84,91,0.06);
  --tf-backdrop: rgba(68,60,71,0.8);

  /* Type */
  --tf-font-ui: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  --tf-font-base: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --tf-fs-xs: 13px;
  --tf-fs-sm: 14px;
  --tf-fs-base: 16px;
  --tf-fs-lg: 21px;
  --tf-fs-xl: 24px;

  /* Radius */
  --tf-radius-sm: 6px;
  --tf-radius-md-btn: 8px;
  --tf-radius-md: 12px;
  --tf-radius-lg: 16px;
  --tf-radius-full: 9999px;

  /* Shadow */
  --tf-shadow-ring-sm: 0 0 0 2px rgba(87,84,91,0.06);
  --tf-shadow-ring: 0 0 0 3px rgba(84,80,88,0.09);
  --tf-shadow-ai-glow: 0 40px 80px 0 rgba(217,119,87,0.24), 0 4px 14px 0 rgba(217,119,87,0.24);

  /* Motion — verbatim from computed CSS rules */
  --tf-ease: cubic-bezier(0.55, 0, 0.1, 1);
  --tf-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.15);
  --tf-dur-fast: 150ms;
  --tf-dur-toggle: 0.15s;
  --tf-dur-focus: 0.1s;
  --tf-dur-base: 200ms;
  --tf-dur-med: 300ms;
  --tf-dur-menu-in: 175ms;
  --tf-dur-menu-out: 125ms;
}

---

## 3. BUILDER UI SPEC (measured on /form/{id}/create)

Layout, 3 panels + fixed header/toolbar:
- Header bar (breadcrumb, Content/Workflow/Connect/Share/Results tabs, Share/View plans/help/avatar): height approx 48px, background transparent over white app shell.
- Secondary toolbar (Add content, Design, Desktop-view, Preview, accessibility/history/translate/settings icons): height approx 48px, sits directly under header.
- Combined header+toolbar height approx 96px before the 3-panel canvas area begins (canvas top approx y=104 in a 1321x881 viewport).
- Left panel ("Pages" + "Endings"): x=16, width=256px, background #F7F7F8 (distinct from app shell white). No visible border/divider rule — separation is by background-color shift only, not a border or shadow.
- Center panel (canvas): remaining width (~745px in this viewport), background transparent (shows app-shell white #FFFFFF); the actual form-canvas mock inside it is a fixed white card (~361px wide x ~610px tall in this viewport), horizontally centered — a mobile-proportioned preview of the question area, not the full panel width.
- Right panel ("Branching"): width=256px, mirrors left panel width exactly, giving a symmetric 256 / fluid-center / 256 layout with 16px outer margins.
- No resizing/collapsing behavior was observed in this session — GAP: could not confirm collapsibility since no secondary breakpoints were tested per scope limits.

Question list panel (left) — GAP: The only form available has zero questions, so row height, hover/selected states, drag handle, and per-row typography could not be measured directly. Confirmed instead: "Add content" is a solid button (not a link) — background #3C323E, color #FFFFFF, border-radius 8px, font-size 14px/500, padding 1px 12px, height 32px. Empty-list appearance: "Pages" heading is 14px/500, color #3C323E, padding 20px 20px 12px, with an empty body; "Endings" section shows the same heading style plus a 32x32px square + icon-button (radius 8px) for adding an ending — the only visible "add" affordance in the empty left rail.

Question editor panel (center) — GAP: no question exists to open in the editor, so field-label typography, input rest/focus styling, per-question toggle, and options editor could not be measured directly there. The generic toggle/switch component (measured instead inside Form Settings, same shared design-system component): track 28x16px, radius 9999px (pill), on-state track background #655D67, knob 10x10px circle #FFFFFF, knob position via transform: translateX(12px) when on, transition: transform 0.15s. Off-state color not measured (would require toggling a live setting — skipped under strict read-only rule).

Live preview panel (right): in the empty-form state this panel is a blank white rectangle with no chrome, no device frame, no scrollbars — a plain flat panel, not a phone/browser mockup. GAP: cannot confirm scaling/pagination behavior with real question content.

Question type picker ("Add content" modal) — fully captured:
- Modal: width 960px, background #F7F7F8, border-radius 16px, box-shadow 0 0 0 3px rgba(84,80,88,0.09) (a soft "ring" outline rather than a blurred drop shadow).
- Structure: left rail with a search input, a "Recommended" list (3 items), a "Connect to apps" list; main area is a list grouped into named categories (not a uniform icon grid): "Contact info", "Choice", "Rating & ranking", "Text & Video", "Other" — 3 columns visible across the modal width.
- Category heading: 14px/500, color #3C323E.
- Row (item) button: height ~37px, padding 6px 12px 6px 8px, border-radius 8px, gap 10px between icon and label, background transparent at rest.
- Item label typography: 14px/400, color #655D67.
- Search input: font-size 14px, borderless at the input level (border lives on a wrapper).
- GAP: precise icon pixel size/color per category not isolated via computed style (colors observed visually per category — pink for Contact info, purple for Choice/Rating, blue for Text&Video, orange for Other — not confirmed via getComputedStyle).

---

## 4. DESIGN TOKENS (raw findings)

Color, by role:
- Page background: #FAFAFA (app root wrapper)
- Panel background: #F7F7F8 (dashboard main area, builder left rail)
- Canvas/card/elevated background: #FFFFFF (builder canvas, dashboard cards, modals)
- Primary text: #3C323E (page titles, card titles, primary buttons)
- Secondary text: #655D67 (list items, descriptions, workspace label)
- Active-tab text: #4C414E (selected top nav tab)
- Muted/low-contrast icon: #E5E4E5 (nav chevrons on light background)
- Border / outline-button border: rgba(81,76,84,0.15)
- Modal/menu ring "shadow": rgba(84,80,88,0.09) at 3px spread
- Card ring "shadow": rgba(87,84,91,0.06) at 2px spread
- Accent — promo/growth: #177767 ("Get more responses" CTA)
- Accent — AI feature: #D97757 ("Chat to create" input glow)
- Modal backdrop: rgba(68,60,71,0.8), no blur
- Toggle on-state track: #655D67

No error/warning colors were encountered in this read-only pass (GAP — none surfaced without triggering a validation state).

Type scale (smallest to largest):
- 13px/500 — small outline-button labels ("Manage")
- 14px/400 — body copy, descriptions, table/list text, menu items
- 14px/500 — buttons, tab labels, category headings, workspace nav label
- 16px/400 — dashboard form-card title (system-ui base stack)
- 21px/400 — empty-state heading ("No responses")
- 24px/400 — page title ("My workspace"), modal title ("Form settings")

Two font stacks are in active use: --tf-font-base (system-ui...) for page-level headings/body, and --tf-font-ui (-apple-system...) for buttons and most componentized UI. Both are system-font stacks — no custom webfont was detected in the admin UI in this session.

Spacing: recurring values 1px, 6px, 8px, 10px, 12px, 16px, 20px, 32px, 40px. Not a strict 4px or 8px multiple system — several fractional hairline values appear (e.g. 0.666667px borders). Closest approximation: an 8px base unit with occasional 2px/6px half-steps for compact controls.

Radius: 6px, 8px, 12px, 16px, 9999px (pill). Small controls 6–8px; cards/menus/popovers 12px; large modals 16px; toggles fully pilled.

Shadows (verbatim):
- none — dashboard cards at rest (separation via background-color contrast only)
- rgba(87,84,91,0.06) 0px 0px 0px 2px — theme gallery tile
- rgba(84,80,88,0.09) 0px 0px 0px 3px — modals, dropdown/actions menus, Design popover
- rgba(217,119,87,0.24) 0px 40px 80px 0px, rgba(217,119,87,0.24) 0px 4px 14px 0px — "Chat to create" AI input (only true blurred drop-shadow found)

Transitions/animations (verbatim from CSS rules):
- transition: width 300ms cubic-bezier(0.55, 0, 0.1, 1), opacity 300ms cubic-bezier(0.55, 0, 0.1, 1)
- transition: opacity 300ms cubic-bezier(0.55, 0, 0.1, 1)
- .slideUp-enter-active { transition: 175ms cubic-bezier(0.175, 0.885, 0.32, 1.15) 200ms }
- .slideUp-exit-active { transition: 125ms ease-out }
- .fade-enter-active { transition: opacity 175ms }
- .fade-exit-active { transition: opacity 125ms ease-out }
- transition: outline-color 0.1s ease-in-out, opacity 0.1s ease-in-out
- transition: transform 300ms ease-out (chevron/disclosure rotation)
- transition: max-height 300ms, opacity 200ms (accordion expand)
- transition: transform 150ms (hover micro-interaction)
- transition: box-shadow 200ms cubic-bezier(0.55, 0, 0.1, 1), border-color 200ms cubic-bezier(0.55, 0, 0.1, 1)
- transition: background-color 0.2s, color 0.2s, border-color 0.2s (search-input wrapper focus, confirmed directly)
- transition: transform 0.15s (toggle-switch knob, confirmed directly)
- animation: 0.8s linear infinite placeholder-spinner-rotation / 720ms linear infinite variants (loading spinners)

The dominant, repeated easing curve across the app is cubic-bezier(0.55, 0, 0.1, 1) at 200–300ms. Modal/popover entrances use a distinct springy curve cubic-bezier(0.175, 0.885, 0.32, 1.15) at 175ms with a 200ms delay, exiting faster (125ms ease-out) with no spring.

---

## 5. RESPONDENT FLOW SPEC — GAP, mostly inaccessible

I read the Share panel of the existing form (non-committal — only read the pre-existing public URL, https://form.typeform.com/to/UXLBpVOT, clicked nothing that publishes/changes state) and opened that URL directly. The form has zero questions, so it rendered an empty shell — no title, no input, no choice cards, no rating widget, no thank-you content. Could not populate it per the hard rule against creating/filling forms. Measurable on the empty shell:

- Body background: #FAFAFA, font stack identical to admin (no distinct respondent-side webfont detected here).
- Branding badge ("Powered by Typeform"): an <a> element, bottom-right, background rgba(250,250,250,0.3), border-radius 8px, padding 7px 8px, text color #E5E4E5 on this light coverless background (expect higher contrast with a themed dark cover).
- Navigation chevrons: 32x32px button, bottom-left, border-radius 2px 8px 8px 2px (rounded outer corner, square inner corner), background rgba(250,250,250,0.3), icon color #E5E4E5.
- Progress bar track exists in the DOM even with 0 questions, background rgba(42,34,43,0.3), renders at 0x0px since there are no pages — position/animation behavior could not be observed.

Everything else (question title vs description typography, input rest/focus/error states, advance-button styling and keyboard hint, choice-row/letter-badge styling, dropdown vs multiple-choice rendering, rating units, inter-question transition duration/easing/opacity, thank-you screen) is an unfilled GAP — inaccessible without creating question content, which the hard rules forbid.

---

## 6. DASHBOARD / FORMS LIST SPEC

- View toggle: List and Grid, both available; List is default.
- Grid: display:grid, grid-template-columns: 306px 306px 306px (3 fixed columns at this viewport), gap: 16px.
- Card: 306x150px, background #FFFFFF, border-radius 12px, box-shadow none at rest (no border either) — separation from the page's #F7F7F8 background is by plain contrast, not elevation. GAP: hover-state shadow/border not captured.
- Card title typography: 16px/400, color #3C323E, with a small type/status icon below it.
- Status indicator (draft vs published): GAP — only a draft form was available, no published form existed to contrast against.
- Response count: shown via the "Responses collected 0/10" quota widget in the left sidebar, not per-card in this workspace (only one card present) — GAP for per-card display.
- Actions menu ("..." on a card): floating list, padding 8px on the container, background #FFFFFF, border-radius 12px, box-shadow 0 0 0 3px rgba(84,80,88,0.09) (same ring as modals). Items: Copy link, Content, Workflow, Connect, Share, Results, Rename, Duplicate, Copy to, Move to, Delete. Row height 32px, padding 6px 12px 6px 8px, font 14px/400, color #655D67, background transparent at rest.
- Create new form control: solid dark button, background #3C323E, color #FFFFFF, border-radius 8px, font 14px/500, padding 1px 12px, height 32px, top-left of the workspace column.
- Empty state: not directly observed (workspace has one form) — GAP.
- Promo/upsell banner: "Get more responses" pill button, background #177767, color #FFFFFF, border-radius 6px, font 13px/500, padding 1px 8px.

---

## 7. RESULTS AND RESPONSES SPEC

- Insights tab: aggregate counters ("Big picture": Views/Starts/Submissions/Completion rate/Time to complete) as large plain numbers under small gray labels — no bar charts rendered since all counts are 0.
- Upgrade-gated panel: rounded card promoting "Question-by-question insights" with a soft mint-green illustrated panel, an "Upgrade plan" solid dark button plus a plain-text "Learn more" link, and fine print listing which plans unlock it — solid CTA + secondary text link + illustrative mock, not a hard block.
- Responses tab empty state: centered layout, heading "No responses" at 21px/400, color #3C323E; description 14px/400, color #655D67; two buttons — "Share your form" (solid, #3C323E bg, #FFFFFF text, 8px radius) and "Generate test response" (outline, background rgba(255,255,255,0.8), border rgba(81,76,84,0.15), same radius/typography, muted text #655D67).
- GAP: table/row structure for actual responses, single-response detail view, and free-text-vs-choice-answer rendering — this form has zero responses; "Generate test response" was not clicked since it creates data (state-modifying, outside strict read-only scope).

---

## 8. MODALS, TOASTS, SETTINGS SPEC

Modals (captured: "Add form elements" and "Form settings"):
- Backdrop: rgba(68,60,71,0.8), no blur.
- Modal shell: width 960px, background #F7F7F8, border-radius 16px, box-shadow 0 0 0 3px rgba(84,80,88,0.09).
- Title typography: 24px/400, color #3C323E.
- Body/list typography: 14px at weight 400–500 depending on row type.
- Button row (Form settings): right-aligned "Cancel" (plain text) + "Save" (solid, disabled/muted until a change is made).
- Entrance animation: inferred from shared slideUp/fade transition-group classes in the stylesheet — enter 175ms cubic-bezier(0.175, 0.885, 0.32, 1.15) with a 200ms delay, exit 125ms ease-out (fade variant is a plain opacity cross-fade at the same timings).

Toasts: none appeared naturally during this session — no capture, per instruction not to trigger one artificially. GAP.

Settings screen:
- Organization: a left sidebar of sections inside the modal (not tabs, not a full page) — "General", "Access & Scheduling", "Language", with a separated "Block References" item below a divider.
- Theme picker ("Design" popover): two tabs, "My themes" and "Gallery". Gallery is a 2-column grid of theme tiles, 230x158px each, 12px radius, 0 0 0 2px rgba(87,84,91,0.06) ring shadow, each tile showing a mock "Question/Answer" preview plus an accent-color swatch and the theme name below; the currently-applied theme tile shows a visible selection border ("Pearl White" in this session). A small lock/diamond badge marks premium-gated themes.
- Thank-you screen editor: GAP — not reached (lives under Content > Endings; the Endings list was empty and clicking + would create an ending, out of scope).
- "Coming soon"/upgrade-gated panels: see the Insights "Question-by-question insights" panel above.
- Toggle switches (Settings): track 28x16px, border-radius 9999px, on-state background #655D67, knob 10x10px white circle, transition: transform 0.15s. Off-state color: GAP (not measured, would require changing a live setting).

---

## 9. RANKED — TOP 20 VISUAL DETAILS THAT MAKE THIS LOOK LIKE TYPEFORM

1. The "ring" box-shadow system (0 0 0 2–3px at 6–9% opacity, near-black-plum tinted) used on every elevated surface — modals, popovers, menus, theme tiles — instead of conventional blurred drop-shadows.
2. Near-black plum (#3C323E) as the primary color, not blue or black — every solid button, active tab, and heading uses this warm dark neutral.
3. Springy modal/popover entrance (cubic-bezier(0.175,0.885,0.32,1.15), 175ms, 200ms delay) versus a plain fast fade-out on exit (125ms, no spring).
4. The dominant ease curve cubic-bezier(0.55,0,0.1,1) at 200–300ms reused across expands, fades, and chevron rotations.
5. Two-tier radius system: 8px buttons, 12px cards/menus/popovers, 16px large modals, fully-pilled toggles.
6. Panels distinguished by background-color contrast alone (#F7F7F8 vs #FFFFFF) rather than borders or shadows.
7. Hairline sub-pixel borders (0.667px, device-pixel-ratio aware) on outline buttons instead of solid 1px borders.
8. Warm off-white page background (#FAFAFA) rather than pure white or cool gray.
9. Compact 32px-tall controls as the universal height across buttons, menu rows, and inputs.
10. Grouped, categorized question-type picker (Contact info / Choice / Rating & ranking / Text & Video / Other) rather than one flat icon grid.
11. Pill-shaped toggle switches with a fast 0.15s knob transform.
12. Modal backdrop tinted plum-gray at 80% opacity with no blur, rather than neutral black.
13. A tight, restrained type scale (13/14/16/21/24px) with very few size steps.
14. System-font-only stack in the admin UI (no custom webfont loaded) — a quiet typographic voice.
15. Actions/theme-tile "..." menus and cards consistently right-anchored with icon-first affordances.
16. Upgrade-gated panels use soft pastel illustration + solid dark CTA + plain-text "Learn more" link + fine print, never a hard lock screen.
17. Bottom-right "Powered by Typeform" badge and bottom-left split-pill nav chevrons on respondent forms, both semi-transparent over the cover.
18. Teal-green accent (#177767) reserved specifically for growth/upsell CTAs, distinct from the neutral dark primary buttons.
19. Warm terracotta glow shadow reserved uniquely for the AI "chat to create" entry point, differentiating AI affordances from standard UI.
20. Empty states centered with a two-button pattern (solid primary + muted outline secondary) rather than a single CTA.
