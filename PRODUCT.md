# Product

## Register

brand

## Users

Two audiences, weighted equally — and the site must read as credible to both at once:

1. **Recruiters and hiring managers** scouting engineering and design talent. They visit cold (link in résumé, DM, search), spend 10–40 seconds, and decide whether to reach out. They scan for competence signals: shipped work, technical range, real project depth, a name they can remember.
2. **Peer engineers and designers** — the audience that respects craft. They arrive from a link shared in a chat, a GitHub profile, a footer credit. They judge the portfolio as a piece of work in itself: the motion, the type, the interactions, the restraint (or lack of it).

Context: mobile-first visitors from a link, often in a busy feed. Ambient light varies. Attention is scarce. The job to be done is the same for both audiences: **"show me who this person is and what they can build, fast, without making me feel like I'm reading a template."**

## Product Purpose

clh.lol is a personal portfolio and project showcase for Charlie (GitHub: Charlie284). It exists to:

- Establish a memorable individual identity online (one URL that *is* the person).
- Surface real shipped work — projects, writing, GitHub activity, video content — in a way that respects the viewer's time.
- Demonstrate, through the site itself, that the author has taste and the technical chops to execute it. The portfolio is itself a portfolio piece.

Success looks like: a recruiter books a call, a peer shares the link, a collaborator DMs. Secondary: the author keeps using it (blog, projects, commits stay live and current).

## Brand Personality

**Bold · Playful · Technical.**

- **Bold:** confident, not loud. Strong typographic statements, decisive contrast, a layout that takes a position (asymmetric, off-center, committed) rather than hedging toward center-stack safety.
- **Playful:** motion and interaction carry personality — a spring cursor, scroll-linked project blur, snappy page transitions. Play is in the *behavior*, not in cartoon illustration or goofy copy. The voice is dry and direct, never zany.
- **Technical:** the site reads as built by someone who knows what they're doing. Precise spacing, real performance care, visible engineering signals (live commit graph, code blocks in the blog). Detail is the personality.

Emotional goals: **confidence, delight-through-craft, curiosity.** A visitor should leave thinking "this person is good *and* fun to work with."

## Anti-references

What clh.lol must NOT look like:

- **Generic developer portfolio template.** Centered hero, three-card project grid, gradient buttons, indigo/violet accent, Inter everywhere. The default "I used a Tailwind starter" look. Rejected.
- **SaaS marketing landing.** Cream/beige body bg, hero-metric stack (big number + small label + supporting stats + gradient accent), feature-card grids, "trusted by" logo strip. This is a person, not a startup. Rejected.
- **Cyberpunk / terminal cliché.** Green-on-black matrix rain, `>_` prompts, scanlines, "hacker" pastiche. Technical ≠ costume. Rejected.
- **Overly corporate.** Blue-trust palette, stock photography, enterprise-safe polish. Reads as a consultancy, not a person. Rejected.

## Design Principles

1. **The site is the work.** Every interaction is a demo of how Charlie builds. If a section isn't worth doing well, cut it — don't ship filler.
2. **Commit to a position.** Asymmetric, off-center, opinionated layouts. Hedging toward centered symmetry is the AI-template tell; take the stance and live with it.
3. **Motion is behavior, not decoration.** Animation reveals what's happening (scroll position, page change, hover state). Suppress the uniform entrance-reflex; let each motion fit what it reveals. Always provide a reduced-motion path that still works.
4. **Black is a choice, not a default.** The dark canvas is committed, not "safe." Contrast stays high (white ink on near-black), accent earns its place, glass is purposeful not decorative.
5. **Show the technical.** Real shipped artifacts (commit graph, live project links, code in the blog) are content, not garnish. The credibility comes from the work being visible.

## Accessibility & Inclusion

- **WCAG AA contrast** as the floor. Body text white-on-near-black must clear 4.5:1; large/display text clears 3:1. Placeholder and muted text held to the same 4.5:1, not the gray-on-dark default.
- **`prefers-reduced-motion: reduce`** honored on every animated surface. Page transitions collapse to crossfades or instant swaps; scroll-linked blur/scale settles to static; the custom cursor still tracks but loses its spring.
- **Keyboard navigation** works end-to-end. Focus is visible (a ring that survives the dark canvas), nav and links are reachable without the mouse, the command palette is operable from keyboard.
- **Color is never the sole signal.** Hover states, active states, and link affordances carry a non-color cue (underline, scale, weight).
- **Touch parity.** The custom cursor degrades gracefully on touch devices; primary actions are tap-sized, not hover-only.