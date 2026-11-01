# sneakyram-platform

Source for two static sites, built from one repository:

| Site | Folder | What it is |
| --- | --- | --- |
| [blog.sneakyram.in](https://blog.sneakyram.in/) | `apps/blog` | Blog posts and project build logs ([Astro](https://astro.build/)) |
| [docs.sneakyram.in](https://docs.sneakyram.in/) | `apps/docs` | GitBook-style write-ups for retired Hack The Box content ([Starlight](https://starlight.astro.build/)) |

Both are plain HTML files on the server: no PHP, no database, nothing to log in to. The community
app (gallery, comments, live chat) comes later as `apps/studio`, backed by Supabase.

## Run it

Requires Node 22.23.4 or newer.

```bash
npm ci                 # install exactly what package-lock.json lists
npm run dev:blog       # http://localhost:4321, reloads as you edit
npm run dev:docs       # http://localhost:4321 (run one at a time)
npm run verify         # tests + write-up rules + both builds, the same checks CI runs
npm run preview:blog   # serve the built blog with its real security headers
npm run preview:docs
```

## Write something

- **Blog post**: copy `apps/blog/src/content/posts/_template.md`. The file name becomes the URL.
  Posts with `draft: true` show up in `dev:blog` but never in a build.
- **Project**: copy `apps/blog/src/content/projects/_template.md`. Posts that set
  `project: <file name>` appear in that project's build log.
- **Write-up**: copy `apps/docs/src/content/docs/htb/machines/_template.md` into the right
  platform folder. The sidebar picks it up automatically.

Files whose names start with `_` are never published.

## What happens on every push

`.github/workflows/sites.yml` runs on every push and pull request:

1. `npm test` runs the unit tests for the scripts in `scripts/`.
2. `npm run check:writeups` refuses Hack The Box write-ups that aren't retired, and any page
   containing a flag or a 32-character hash.
3. `npm run build` builds both sites. Each build then runs:
   - `scripts/csp.mjs`, which hashes every inline script into the Content-Security-Policy in
     `.htaccess`, and fails if a page has an inline event handler or a `javascript:` URL
   - `scripts/check-links.mjs`, which fails on any broken internal link

On `main` only, the deploy job then pushes the built files to two branches,
`deploy/blog` and `deploy/docs`. Hostinger deploys each branch into its subdomain's folder.

## Security choices, and why

| Choice | Why |
| --- | --- |
| Strict CSP with build-time hashes | Only this site's own scripts can run. An injected `<script>` has no matching hash, so the browser refuses it. |
| `assetsInlineLimit: 0` in both Astro configs | Keeps scripts as files, so there's almost nothing to hash. |
| `.htaccess` blocks dotfiles | Hostinger's Git deploy leaves a `.git` folder in the site directory. Serving it would leak the deploy history. |
| `.htaccess` redirects to the real hostname | Subdomain folders live inside `sneakyram.in/public_html`, so `sneakyram.in/blog/` would otherwise serve the blog under the wrong origin. |
| Actions pinned to commit SHAs | A tag can be moved to new code; a commit can't. Dependabot updates the pins. |
| `ignore-scripts=true` in `.npmrc` | Dependencies can't run code during `npm ci`, the usual way compromised packages attack. |
| `include-hidden-files: true` on the artifact upload | Without it, `.htaccess` and `.well-known/` are silently dropped and the sites would ship with no security headers. |
| Dependabot `cooldown` of 7 days | New package versions wait a week, which keeps freshly published malicious releases out. |

## One-time Hostinger setup

1. In hPanel, connect GitHub (Websites → Git, or the GitHub integration).
2. Deploy branch `deploy/blog` to `blog.sneakyram.in`, and `deploy/docs` to `docs.sneakyram.in`,
   as static sites with auto-deploy on.
3. After the first deploy, open both sites and check the response headers in the browser's
   dev tools (Network tab, click the page, Headers).
