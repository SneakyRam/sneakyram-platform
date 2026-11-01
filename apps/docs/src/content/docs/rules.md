---
title: How I publish write-ups
description: The rules every write-up on this site follows, and how the build enforces them.
---

Practice platforms let people publish solutions only under certain conditions. These are the
rules this site follows. The build checks the first and third automatically and refuses to
publish a page that breaks them.

## 1. Retired content only

For Hack The Box, I publish write-ups only for content HTB allows:

- retired Machines, Challenges, Sherlocks and Endgames
- Starting Point machines
- Tier 0 Academy modules

Every Hack The Box write-up records the date the content retired. A write-up without that date,
or with a date in the future, fails the build.

## 2. Check each platform's own rules

TryHackMe, PortSwigger and other platforms each have their own terms. I check the room or lab's
page before publishing.

## 3. No flags, hashes or credentials

Flags, password hashes and credentials are replaced with `[REDACTED]`, even for retired content.
The build scans every page for flag formats and 32-character hex strings and stops if it finds one.

## 4. Mistakes get fixed

If you spot something that breaks these rules, or a mistake in a write-up, contact me through
the links in the header and I'll fix it.
