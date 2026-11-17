# FC Đá Bay Bóng — club workspace

Primary task: check the next session, record the A/B match, and retrieve the exact historical roster and result.

Tokens: canvas `#F2F6F8`, surface `#FFFFFF`, ink `#193347`, muted `#536B7B`, pitch `#157251`, team B `#245FC7`. Lines use `#DCE5EB`. Team identity is always written A/B as well as colored.

Typography: Be Vietnam Pro for Vietnamese UI and Barlow Condensed for large scores. 14–16px body, 24–36px page titles, 64–96px score. Labels use sentence case. Align operational content left, scores and team crests center.

Layout:

```text
desktop: [club + navigation + member]
         [page title                 quick action]
         [next session / A vs B      ][season summary]
         [search | season | status | page size]
         [date / ground | A score B | report] ...

mobile:  [club             menu]
         [next session]
         [season summary]
         [filters in two columns]
         [match rows stack]
```

Review: replaced generic dark glass and gold gradients with a light club operations workspace. The memorable element is a pitch drawing around the A/B scoreboard, not repeated decorated cards. Avoid invented metrics, promotional filler, uppercase labels, gratuitous motion and emoji icons. Existing profile, fund and blog screens adopt the same light tokens.

Interaction: native labeled inputs, visible focus, at least 44px touch targets, keyboard dismissal of dialogs, reduced motion, meaningful empty/error states. Match records use saved player names; attendance and selected playing roster remain distinct concepts.

## Themes and operational emphasis

Light is the default; members can explicitly save a dark palette. Both modes share semantic surface/text/border tokens, with brighter labels and subdued pitch colors in dark mode. Photos retain their original colors. The theme is applied before app render.

Venue and kickoff use separate fact blocks with a large value, date and Vietnam time zone. Player rows distinguish fixed team from the per-match playing team; temporary loans are written in text. The journal uses a featured story and photo mosaics, with a separate full-screen gallery and keyboard controls.
