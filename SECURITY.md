# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.11.x  | :white_check_mark: |
| < 1.11  | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly. **DO NOT** open a public GitHub issue.

### How to Report

1. **Email**: Send details to **WuSuBuDuoMing@users.noreply.github.com**
2. **GitHub Private Reporting**: Use [GitHub's private vulnerability reporting](https://github.com/WuSuBuDuoMing/eternal-blossoms/security/advisories/new)

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)

### Response Timeline

| Severity | Initial Response | Resolution Target |
| -------- | ---------------- | ----------------- |
| Critical | 24 hours         | 48 hours          |
| High     | 48 hours         | 7 days            |
| Medium   | 7 days           | 30 days           |
| Low      | 14 days          | Next release      |

## Security Measures

This project implements the following security measures:

- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **CORS Configuration**: Configurable via `CORS_ORIGIN` environment variable
- **Request Size Limit**: JSON body parser limited to 10MB for photo uploads
- **Input Validation**: Card ID validation (integer, positive), path traversal prevention
- **File Upload Security**: Secure filename generation, file type validation

## Disclosure Policy

- We will confirm receipt of your vulnerability report within the response timeline above
- We will provide an estimated timeline for a fix
- We will notify you when the vulnerability has been fixed
- We will credit reporters (unless anonymity is requested)

Thank you for helping keep Eternal Blossoms and its users safe!
