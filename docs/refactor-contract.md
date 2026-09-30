# Refactor contract

The current worktree is the behavior baseline. Existing article edits are outside the code refactor and must be reviewed separately. The home and article layout now follows the narrow, light design of https://kuracchi.com/blog/advent-calendar-2025-12-17/. Keep public routes and data shapes stable, and run the checks below before the next pass.

## Public surfaces

- Pages: home, blog posts, projects, tags, gallery, statistics, image comparison, and 404.
- Generated resources: `/search.json`, `/rss.xml`, `/og-image/**`, sitemap, and Pagefind index.
- Content syntax: Markdown and MDX, including admonitions, GitHub cards, `fuki`, `compare`, image captions, code filenames, and standalone Twitter/YouTube links.
- Browser behavior: light home and article pages, theme choice on other pages; navigation links in the footer; title and date article transitions; code copy; image lightbox; gallery deep links, history, keys, touch gestures, loading, and retry.
- CLI behavior: `scripts:new-post` and `scripts:draft`, including slug validation and archive handling.

## Checks

1. Run `pnpm build`, then `pnpm parity`. The fixture records HTML route paths, all 28 article bodies, and hashes for stable public artifacts. Only update it for an intentional design, content, or API change.
2. Run `pnpm test` for pure transformations and CLI filesystem fixtures.
3. Run `pnpm check` for formatting. The baseline currently has four unrelated Markdown formatting failures; check changed source files directly until those are resolved in their own pass.
4. Compare home, article, and gallery at narrow and wide viewports. For the gallery, exercise direct `?photo=` links, back/forward, arrow keys, swipe, load failure, retry, and focus return. Check light article rendering, code blocks, embeds, and comparison controls; check both themes on other pages.

## Separate migrations

Astro's deprecated Markdown configuration, dependency upgrades, public route or JSON changes, and gallery architecture replacement require separate migration work with their own baselines.
