# Security policy

## Secrets

This project reads credentials from `.env`. Never commit that file or paste its contents
into an issue.

If you believe a credential was exposed:

1. Rotate it immediately at the provider (SMTP, Gotify, proxy).
2. Remove it from the repository history if it was committed.
3. Check the provider logs for unexpected use.

The repository ignores `.env`, `.env.*` (except `.env.example`) and `.DS_Store`.

## Reporting a vulnerability

Please do not open a public issue with exploit details. Contact the maintainer privately
through the email address in `package.json` and include:

- affected version or commit,
- reproduction steps,
- impact assessment.

You will receive an acknowledgement as soon as possible. Please allow time for a fix
before publishing details.
