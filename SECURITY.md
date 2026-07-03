# Security Policy

## Overview

PuraEstate takes security seriously. This document outlines our security policies, practices, and procedures for responsible disclosure of security vulnerabilities.

## Security Contact Information

**Primary Security Contact:**
- Email: security@puraestate.com
- Response Time: 24 hours
- PGP Key: Available on request at security@puraestate.com with subject "PGP REQUEST"

**Secondary Contact:**
- Email: security-team@puraestate.com
- PGP Key: Available upon request

## Reporting Security Issues

### Responsible Disclosure

We follow responsible disclosure principles and ask that security researchers:

1. **Do not** publicly disclose vulnerabilities before we have an opportunity to address them
2. **Do not** access or modify data that does not belong to you
3. **Do not** use automated scanning tools without explicit permission
4. **Do not** perform denial-of-service attacks
5. **Do** give us reasonable time to fix vulnerabilities before disclosure

### Reporting Procedure

To report a security vulnerability:

1. Email security@puraestate.com with a detailed description of the vulnerability
2. Include:
   - Description of the vulnerability
   - Steps to reproduce (if applicable)
   - Potential impact
   - Suggested fix (if you have one)
   - Your contact information

3. **Do not** include sensitive data, usernames, or passwords in the initial report

### Vulnerability Disclosure Timeline

We commit to the following timeline:

- **Initial Response**: Within 48 hours of receiving a report
- **Status Updates**: Every 7 days while the vulnerability is being investigated
- **Fix Development**: We aim to develop a fix within 14 days of confirmation
- **Patch Release**: Security patches are released as soon as fixes are verified
- **Public Disclosure**: We coordinate with the reporter on disclosure timing
  - For Critical vulnerabilities: 90 days from patch release
  - For High vulnerabilities: 60 days from patch release
  - For Medium/Low vulnerabilities: 30 days from patch release

## Security Scanning

### Automated Scanning

We perform continuous security scanning using:

- **Dependency Scanning**: Weekly scans for vulnerable npm packages via npm audit and Snyk
- **Static Code Analysis**: Daily scans using ESLint security rules and SonarQube
- **Container Scanning**: All Docker images are scanned for vulnerabilities on build
- **SAST (Static Application Security Testing)**: Weekly full-codebase scans
- **Secret Scanning**: Continuous scanning for exposed API keys and credentials

### Frequency

- **Production**: Daily automated scans
- **Staging**: Daily automated scans
- **Development**: Weekly automated scans
- **Manual Security Audits**: Quarterly by internal team + annual by external firm

## Known Security Limitations

### Current Constraints

1. **Third-Party Dependencies**: We rely on npm packages which may have vulnerabilities. We actively monitor and update dependencies.

2. **Firebase Authentication**: We depend on Firebase for user authentication. See Firebase security documentation for their security model.

3. **Stripe Integration**: Payment processing delegated to Stripe. PCI-DSS compliance depends on proper Stripe integration.

4. **OpenRouter API**: LLM requests routed through OpenRouter. See their privacy policy regarding data handling.

5. **AWS Infrastructure**: Infrastructure security depends on proper AWS security group and IAM policy configuration.

### Risk Acceptance

- We acknowledge that no system is 100% secure
- Users should follow security best practices (strong passwords, 2FA)
- We recommend reviewing our Privacy Policy and Terms of Service

## Security Best Practices for Contributors

### Development

1. **Never commit secrets**: Use `.env.example` as a template, not actual `.env` files
2. **Use the secret manager**: Store sensitive data in environment variables only
3. **Validate input**: Always validate and sanitize user input
4. **Escape output**: Prevent XSS attacks by properly escaping output
5. **Use HTTPS**: Always use HTTPS for external communications
6. **Parameterized queries**: Use parameterized queries to prevent SQL injection

### Code Review

1. Review all security-related changes with extra scrutiny
2. Check for hardcoded credentials or secrets
3. Verify proper input validation and output escaping
4. Ensure authentication and authorization checks are in place

### Dependencies

1. Keep dependencies up to date: `npm audit fix`
2. Review major dependency updates for breaking changes or security issues
3. Remove unused dependencies regularly
4. Only use well-maintained, trusted packages

### Testing

1. Include security test cases in your tests
2. Test with invalid/malicious input
3. Test authentication and authorization boundaries
4. Use `npm audit` before submitting pull requests

## Security Headers

All production responses include the following security headers:

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Authentication & Authorization

- User authentication is handled via Firebase Authentication
- API endpoints require valid JWT tokens
- Role-based access control (RBAC) is enforced on protected routes
- Sessions have appropriate timeout periods
- Multi-factor authentication (MFA) is available and encouraged

## Data Protection

- Sensitive data at rest is encrypted using industry-standard encryption
- Data in transit is protected with TLS 1.2+
- Database backups are encrypted and stored securely
- User passwords are hashed using bcrypt or equivalent

## Incident Response

In the event of a security incident, we follow our Incident Response Plan (see `docs/INCIDENT_RESPONSE.md`).

## Compliance

PuraEstate is committed to compliance with:

- GDPR (EU General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- PCI-DSS (Payment Card Industry Data Security Standard) - for payment processing
- HIPAA (if handling health data) - applicable standards
- SOC 2 controls where applicable

For detailed compliance information, see `docs/GDPR_COMPLIANCE.md` and `.github/COMPLIANCE_CHECKLIST.md`.

## Security Updates

Security patches are released as needed and communicated via:

- GitHub Security Advisories
- Email notification to security subscribers
- Release notes on our website

Users are encouraged to enable automatic updates or check for updates regularly.

## Third-Party Security Assessments

We welcome third-party security assessments. If you're interested in conducting a penetration test or security audit, please contact security@puraestate.com.

## Questions?

For security-related questions that are not vulnerability reports, please contact security@puraestate.com.

---

**Last Updated:** March 12, 2026
**Next Review Date:** September 12, 2026
