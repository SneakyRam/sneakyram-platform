---
title: sneakyram.in platform
summary: My own corner of the web, built step by step - a blog, write-ups and, later, a community gallery with live chat.
status: building
stack: [Astro, Starlight, GitHub Actions, Supabase, Cloudflare]
started: 2026-11-02
order: 1
---

The plan has five phases, built in order:

1. **Clean up** the old, unused subdomains on the server.
2. **Content**: this blog and the write-ups site, deployed by GitHub Actions with strict security headers.
3. **Accounts**: one sign-in for the whole community, backed by Supabase with row-level security.
4. **Gallery and comments**, with an upload pipeline that checks every file and strips photo location data.
5. **Live chat**, where every message passes through the database before anyone sees it.
