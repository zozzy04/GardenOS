# Security Policy

## Supported Versions

We actively support the following versions of GardenOS:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it privately:

- **Email**: [Your email or security contact]
- **GitHub Security Advisory**: Use the [Security tab](https://github.com/TUO_USERNAME/gardenos/security) to report vulnerabilities

We will respond to security reports within 48 hours and work with you to address the issue.

## Security Best Practices

### For Users

1. **Never commit `.env` files** - Always use `.env.example` as a template
2. **Use strong passwords** - For Supabase authentication
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use HTTPS** - Always deploy with HTTPS enabled
5. **Rotate API keys** - If you suspect a key has been compromised

### For Developers

1. **Environment Variables** - Never hardcode sensitive data
2. **Row Level Security** - Always enable RLS in Supabase
3. **Input Validation** - Validate all user inputs
4. **Dependencies** - Keep all dependencies up to date
5. **Secrets Management** - Use environment variables for all secrets

## Known Security Considerations

- **Supabase Anon Key**: The anon key is safe to expose in frontend code (it's designed for this), but ensure RLS policies are properly configured
- **Database Connection String**: Never expose the PostgreSQL connection string in frontend code
- **User Data**: All user data is protected by Row Level Security (RLS) policies

## Security Updates

Security updates will be released as patches. Please keep your installation up to date.

