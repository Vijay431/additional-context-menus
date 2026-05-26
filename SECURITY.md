# Security Policy

## Supported Versions

We provide security updates for the following versions of Additional Context Menus:

| Version | Supported          | Node.js Compatibility               |
| ------- | ------------------ | ----------------------------------- |
| 2.1.x   | :white_check_mark: | Node.js 22, 24, 26 — VS Code 1.111+ |
| 2.0.x   | :white_check_mark: | Node.js 20, 22, 24                  |
| 1.2.x   | :x:                | —                                   |
| 1.1.x   | :x:                | —                                   |
| 1.0.x   | :x:                | —                                   |

## Reporting a Vulnerability

We take the security of Additional Context Menus VS Code Extension seriously. If you believe you have found a security vulnerability, please follow these steps:

1. **DO NOT** disclose the vulnerability publicly.
2. Send a detailed description of the vulnerability to vijayanand431@gmail.com.
3. You should receive a response within 48 hours.
4. Please provide sufficient information to reproduce the vulnerability.

## What to Include in Your Report

When reporting a vulnerability, please include:

- A clear description of the vulnerability
- Steps to reproduce the issue
- VS Code version and Additional Context Menus version
- Node.js version (if relevant to the vulnerability)
- Operating system and platform information
- Potential impact of the vulnerability
- Any potential solutions you've identified

## Our Commitment

- We will acknowledge receipt of your vulnerability report within 48 hours.
- We will provide regular updates about our progress.
- We will maintain confidentiality of the issue until a fix is released.
- We will credit you (if desired) when we disclose the issue.

## Safe Harbor

We support safe harbor for security researchers who:

1. Make a good faith effort to avoid privacy violations, destruction of data, and interruption or degradation of our services.
2. Only interact with accounts you own or with explicit permission of the account holder.
3. Report any vulnerability promptly.
4. Do not access, modify, or delete data beyond what is necessary to demonstrate the vulnerability.

## Security Considerations

Additional Context Menus extension:

- Only operates on files within your VS Code workspace
- Does not transmit any data externally
- Only accesses VS Code APIs and Node.js built-in modules
- Follows VS Code extension security best practices

## Updates and Notifications

Security updates will be released through:

- GitHub Security Advisories
- Extension changelog (CHANGELOG.md)
- VS Code Marketplace updates
- GitHub releases with security tags

## Automated Security Checks

- Pull requests and pushes to `main` run `pnpm audit --audit-level=high`.
- Pull requests run dependency review and fail on high severity dependency findings.
- A daily security workflow also runs on schedule, manual dispatch, and package manifest or lockfile changes. It uploads audit artifacts and opens a triage issue for critical/high findings or workflow failures.

## Node.js Compatibility & Security

This extension supports Node.js 22, 24, and 26, and VS Code 1.111 and later (last 10 minor versions). Security updates maintain compatibility across this range. If you're using an unsupported version, please upgrade to receive security updates.

Thank you for helping keep Additional Context Menus and its users safe!
