---
name: Security Vulnerability
about: Report a security vulnerability that is not critical
title: '[SECURITY] '
labels: security
assignees: ''
---

## ⚠️ Important Security Notice

**For CRITICAL or HIGH severity vulnerabilities**, please email <vijayanand431@gmail.com> directly instead of using this template.

This template is for:

- Minor security concerns
- Security best practices
- Potential security improvements
- Documentation about security

## Vulnerability Type (check one)

- [ ] **Potential Vulnerability** - Suspected but not confirmed security issue
- [ ] **Best Practice Concern** - Code doesn't follow security best practices
- [ ] **Information Disclosure** - Sensitive information could be exposed
- [ ] **Input Validation** - Missing or insufficient input validation
- [ ] **Dependency Issue** - Security concern with dependencies
- [ ] **Code Quality** - Code that could lead to security issues
- [ ] **Documentation** - Security documentation needed

## Vulnerability Description

Describe the security concern clearly.

**Summary:**
Brief description of the security issue.

**Impact:**
What is the potential impact of this vulnerability?

- [ ] Information disclosure
- [ ] Code execution
- [ ] Data corruption
- [ ] Denial of service
- [ ] Other: ______

**Severity:**

- [ ] Low - Minimal impact
- [ ] Medium - Moderate impact
- [ ] High - Significant impact (use email for critical)

## Affected Component

Which part of the extension is affected?

- [ ] Configuration Service
- [ ] Accessibility Service
- [ ] Extension Manager
- [ ] Commands Manager
- [ ] Other: ______

## Reproduction Steps

If applicable, how can this vulnerability be demonstrated?

1. ***
2. ***
3. ***
4. See vulnerability

## Proof of Concept

**Code Snippet:**

```typescript
[Provide relevant code that demonstrates the issue]
```

**Steps to Reproduce:**
Describe how to trigger the vulnerability.

## Environment

- **VS Code:** Version
- **Extension:** Version
- **OS:** Windows/macOS/Linux
- **Node.js:** Version

## Security Details

**Attack Vector:**
How could an attacker exploit this?

**Attack Scenario:**
Describe a realistic attack scenario.

**Affected Users:**

- [ ] All users
- [ ] Users on specific platforms
- [ ] Users with specific configurations
- [ ] Other: ______

## Mitigation

**Current Mitigation:**
Are there any workarounds or mitigations?

**Proposed Fix:**
How should this be fixed?

**Code Changes:**

```typescript
[Proposed fix if applicable]
```

## Security Best Practices

Are there any security best practices that should be implemented?

- [ ] Input validation
- [ ] Output encoding
- [ ] Secure defaults
- [ ] Principle of least privilege
- [ ] Defense in depth
- [ ] Security testing
- [ ] Other: ______

## Additional Context

**References:**
Link to relevant security standards, CVEs, or documentation.

**Related Issues:**
Link to related GitHub issues or PRs.

**Dependencies:**
Are third-party dependencies involved?

## Privacy Consent

- [ ] I consent to being credited for this vulnerability discovery
- [ ] I prefer to remain anonymous

---

**Thank you for helping improve security!** 🔒
