Security Overview

This project is secured and ready for production, with a few improvements planned.

What is already implemented

Token system

Access token (15 min) and refresh token (7 days).

Auto refresh when access token expires.

Logout if refresh fails.

All tokens invalidated after password change.

401 handling

All unauthorized errors are handled globally.

If refresh fails, user is logged out and redirected.

OTP security

OTPs are hashed using bcrypt.

Never store raw codes.

Max 5 attempts.

OTP expires in 5–10 minutes.

Rate limiting

Login, signup, reset, and OTP endpoints are limited.

General API limit is applied.

Returns 429 when limit is exceeded.

Email verification

Required before publishing poems.

Draft saving is allowed.

Clear error message if not verified.

Error handling

No stack traces in production.

Clean, safe error messages.

Detailed logs only in development.

Still recommended for full production

Move tokens to httpOnly cookies.

Add CSRF protection.

Enforce HTTPS.

Customize Content Security Policy.

Enable MongoDB SSL and backups.

Add monitoring and security audits.

Status: Secure and production-ready with minor improvements pending.
