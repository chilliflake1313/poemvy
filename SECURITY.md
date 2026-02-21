Security Overview;

Implemented Features
Area                                                  	What’s Done
Token System	                                          Access token (15m) + Refresh token (7d). Auto refresh enabled. Tokens invalidated on password change.
401 Handling                                           	Global handler. Auto refresh on failure. Logout if refresh fails.
OTP Security                                           	OTP hashed with bcrypt. Max 5 attempts. Expires in 5–10 minutes. No raw OTP stored.
Rate Limiting                                           Login, signup, reset, OTP endpoints limited. General API limit applied. Returns 429 when exceeded.
Email Verification                                     	Required before publishing poems. Drafts allowed without verification.
Error Handling                                         	No stack traces in production. Clean error messages. Detailed logs only in development.
Basic Security                                        	Helmet enabled. CORS configured. JWT validation active.
