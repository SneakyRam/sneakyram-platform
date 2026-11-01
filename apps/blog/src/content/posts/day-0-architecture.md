---
title: 'Day 0: planning the sneakyram.in architecture'
description: How I split my site into static pages and one login-backed app, and why the database rules carry the security weight.
pubDate: 2026-11-02
tags: [build-log, architecture, web-security]
project: sneakyram-platform
draft: true
---

<!-- Draft: write this one in your own words. Some prompts to answer: -->

## What I want to build

A blog, a projects section, GitBook-style write-ups and a community gallery with live chat.

## The big decision: static first

Why the blog and write-ups are plain files with no server code, and what that removes from the
attack surface.

## Where the security actually lives

Cloudflare protects the sites, but the studio app's browser talks to Supabase directly. What does
that mean for rate limits and row-level security?

## What I'll build first

The order, and what "done" means for each step.
