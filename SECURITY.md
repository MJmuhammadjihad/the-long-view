# Security and privacy

The Long View is a static educational application. It stores journal and checklist data in browser local storage and supports user-initiated backup files. It does not provide an account or a server for storing those notes.

## Reporting a vulnerability

When enabled, use [GitHub’s private vulnerability reporting](https://github.com/MJmuhammadjihad/the-long-view/security/advisories/new). Include the affected version or commit, steps to reproduce, the expected impact, and a minimal example with synthetic data.

If private reporting is unavailable, use the contact options on [the maintainer’s GitHub profile](https://github.com/MJmuhammadjihad). You may open a minimal issue requesting a private contact route, but do not publish exploit details or private data there.

Do not upload real journal backups, financial information, credentials, or data belonging to someone else. Do not test against other people’s accounts or systems.

## Scope and support

Potential concerns include script injection through imported notes, unintended disclosure or transmission of local data, unsafe dependencies, and destructive restore or migration behavior. Calculator correctness problems can be reported as ordinary bugs unless they also involve a security vulnerability.

Fixes target the current default branch and the latest release. There is no guaranteed support or response time for older versions.

## User precautions

Anyone with access to your browser profile may be able to read local notes. Browser clearing, device loss, and private browsing can remove them. Export backups you need, keep them private, and verify a backup before relying on it. Calculator inputs are not stored by the application; external source pages and the hosting provider have their own data practices.
