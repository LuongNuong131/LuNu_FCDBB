# FC Đá Bay Bóng — club workspace

Primary task: check the next session, record the A/B match, and retrieve the exact historical roster and result.

Tokens: canvas `#F3F6F4`, surface `#FFFFFF`, ink `#193347`, muted `#536B7B`, pitch `#157251`, team B `#245FC7`. Lines use `#DCE5EB`. Team identity is always written A/B as well as colored.

Typography: Be Vietnam Pro for Vietnamese UI and Barlow Condensed for large scores. 14–16px body, 24–36px page titles, 40–82px score. Labels use sentence case. Align operational content left, scores and team crests center.

Layout:

```text
desktop: [club + navigation + member]
         [page title                 quick action]
         [next session / A vs B      ][season summary]
         [search | season | status | page size]
         [date / ground | A score B | report] ...

mobile:  [club             theme / menu]
         [next session + venue / kickoff]
         [compact metrics + A/B summary]
         [search             filter toggle]
         [match history]
         [home | matches | players | funds | more]
```

Review: replaced generic dark glass and gold gradients with a light club operations workspace. The memorable element is a pitch drawing around the A/B scoreboard, not repeated decorated cards. Avoid invented metrics, promotional filler, uppercase labels, gratuitous motion and emoji icons. Existing profile, fund and blog screens adopt the same light tokens.

Interaction: native labeled inputs, visible focus, at least 44px touch targets, keyboard dismissal of dialogs, reduced motion, meaningful empty/error states. Match records use saved player names; attendance and selected playing roster remain distinct concepts.

## Themes and operational emphasis

Light is the default; members can explicitly save a dark palette. Both modes share semantic surface/text/border tokens, with brighter labels and subdued pitch colors in dark mode. Photos retain their original colors. The theme is applied before app render.

Venue and kickoff use separate fact blocks with a large value, date and Vietnam time zone. Player rows distinguish fixed team from the per-match playing team; temporary loans are written in text. The journal uses a featured story and photo mosaics, with a separate full-screen gallery and keyboard controls.

## Mobile club interface

`src/club-ui.css` extends the shared tokens and covers touch navigation and responsive records. The fixed five-item navigation appears below 981 px and reserves safe-area space in the page. More opens a native modal dialog, with focus containment, Escape dismissal and scroll locking; it closes on route changes or desktop resize. Current match detail routes keep the matches destination active.

The home page places compact statistics beside the fixture on desktop and before the condensed standings on phones. Search remains visible; extra fixture filters expand on demand below 601 px. Financial records and member management use a single set of controls, rendered as cards below 981 px. Admin creation forms start collapsed on smaller screens and retain explicit expand controls. Standings have a compact mobile presentation with all five supporting statistics. The report editor offers section anchors and a save bar above the phone navigation.

Photo viewing stays separate from uploading. Profile changes reload the selected player and cancel stale requests when moving between players. Router navigation restores previous positions and otherwise returns to the top. The login form is reachable without a large decorative scoreboard on phones, and includes an accessible password visibility control. Inputs retain at least 16 px text on phones to prevent browser auto-zoom.

Validation covers 320, 375, 430, 768, 1024 and 1440 px, light/dark palettes, keyboard focus, real record edits, photo viewing and downloads, and automated accessibility checks. Reduced-motion preferences disable transitions and safe-area insets protect controls on cutout screens.
