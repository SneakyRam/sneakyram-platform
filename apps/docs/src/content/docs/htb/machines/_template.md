---
# Copy this file to htb/machines/<box-name>.md. Files starting with "_" are never published.
title: Box name
description: One line on what the box teaches, under 160 characters.
platform: htb
kind: machine          # machine, challenge, sherlock, endgame, starting-point or academy-tier-0
difficulty: easy       # very-easy, easy, medium, hard or insane
os: linux              # linux, windows or other
techniques: [enumeration, sqli, privesc]
retired: 2026-01-01    # the date HTB retired it; the build refuses future dates or a missing one
draft: true            # remove when ready to publish
---

## Summary

Two or three sentences: the path from first scan to root, and the one idea that made it click.

## Enumeration

```bash
nmap -sC -sV -oA scans/initial 10.10.10.10
```

What the scan showed and what you decided to look at first, and why.

## Foothold

## Privilege escalation

## Flags

Never paste flags or hashes. Write them as `HTB{REDACTED}` or `[REDACTED]`; the build checks.

## What I learned
