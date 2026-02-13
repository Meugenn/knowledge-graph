# Security Guide

## Overview
This document outlines the security measures implemented in The Republic project and best practices for maintaining security.

---

## 🔒 Security Improvements Implemented

### 1. **API Key Protection**

#### ❌ **BEFORE** (Insecure)
- API keys hardcoded in `frontend/.env.production`
- Keys exposed in client-side JavaScript bundles
- Anyone could extract and abuse API keys

#### ✅ **AFTER** (Secure)
- All API keys removed from frontend
- API keys stored only in backend environment variables
- Backend proxy endpoints handle API calls
- Keys never exposed to client-side code

**Implementation:**
- Backend proxy for Semantic Scholar: `/api/semantic-scholar/*`
- Frontend config updated to use backend proxy
- `.env.production` added to `.gitignore`

### 2. **Environment Variable Validation**

#### ❌ **BEFORE** (Risky)
- Server started without checking required variables
- Silent failures when keys missing
- Placeholder values not detected

#### ✅ **AFTER** (Validated)
- Startup validation checks all required environment variables
- Warns about missing optional keys
- Exits with error if placeholder values detected
- Clear error messages guide configuration

**Location:** [backend/src/index.js](backend/src/index.js)

### 3. **Git Ignore Protection**

#### ❌ **BEFORE** (Dangerous)
- `.env.production` not in `.gitignore`
- Risk of committing secrets to repository

#### ✅ **AFTER** (Protected)
- All environment files properly ignored
- `.env.production.example` template provided
- Clear documentation in templates

---

## 🛡️ Security Best Practices

### **1. Environment Variables**

**DO:**
- ✅ Store all secrets in `.env` files
- ✅ Use `.env.example` as templates
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use different keys for dev/staging/production
- ✅ Rotate API keys periodically

**DON'T:**
- ❌ Hardcode API keys in source code
- ❌ Commit `.env` files to Git
- ❌ Share API keys in chat/email
- ❌ Use production keys in development
- ❌ Store keys in frontend environment variables (anything with `VITE_` prefix)

### **2. Private Keys**

**DO:**
- ✅ Generate unique wallets for each environment
- ✅ Use hardware wallets for production
- ✅ Encrypt private keys at rest
- ✅ Limit private key access to necessary services

**DON'T:**
- ❌ Log private keys to console (except in dev wallet generators)
- ❌ Store private keys in plain text
- ❌ Reuse private keys across projects
- ❌ Share private keys between team members

### **3. API Security**

**DO:**
- ✅ Use backend proxies for all external API calls
- ✅ Implement rate limiting
- ✅ Validate all input parameters
- ✅ Use HTTPS for all requests
- ✅ Monitor API usage for abuse

**DON'T:**
- ❌ Expose API keys in client-side code
- ❌ Allow direct API access from frontend
- ❌ Trust user input without validation
- ❌ Log sensitive data

### **4. Deployment Security**

**DO:**
- ✅ Use Vercel/Netlify environment variables UI
- ✅ Enable automatic HTTPS
- ✅ Use CSP headers
- ✅ Regular dependency updates
- ✅ Monitor for security vulnerabilities

**DON'T:**
- ❌ Deploy with default/placeholder credentials
- ❌ Expose debug endpoints in production
- ❌ Use outdated dependencies with known CVEs

---

## 🚨 Common Vulnerabilities & Solutions

### **1. Hardcoded Credentials**

**Vulnerability:**
```javascript
// ❌ NEVER DO THIS
const API_KEY = "sk-1234567890abcdef";
```

**Solution:**
```javascript
// ✅ ALWAYS DO THIS
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error('API_KEY environment variable is required');
}
```

### **2. Frontend API Key Exposure**

**Vulnerability:**
```javascript
// ❌ EXPOSED in client bundle
const apiKey = import.meta.env.VITE_API_KEY;
fetch('https://api.example.com', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

**Solution:**
```javascript
// ✅ SECURE via backend proxy
fetch(`${BACKEND_URL}/api/proxy/endpoint`, {
  method: 'GET'
  // No API key needed - backend handles it
});
```

### **3. Unsafe Input**

**Vulnerability:**
```javascript
// ❌ SQL Injection risk
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Solution:**
```javascript
// ✅ Parameterized queries
const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [userId]);
```

---

## 📋 Security Checklist

Before deploying to production:

- [ ] All `.env` files are in `.gitignore`
- [ ] No API keys in frontend environment variables
- [ ] All API calls go through backend proxies
- [ ] Environment validation passes on startup
- [ ] Private keys are unique per environment
- [ ] HTTPS enabled on all endpoints
- [ ] Dependencies updated and scanned
- [ ] Secrets stored in platform environment variables (Vercel/etc)
- [ ] Rate limiting enabled on public endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Audit logs enabled for critical operations

---

## 🔧 Configuration Files

### Backend Environment (`.env`)
```bash
# Required for blockchain operations
PRIVATE_KEY=your_private_key_here

# Required for AI features
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Required for research data
S2_API_KEY=...

# Optional
KAGGLE_API_TOKEN=...
GITHUB_TOKEN=...
```

### Frontend Environment (`.env.production`)
```bash
# Only contract addresses and backend URL
VITE_BACKEND_URL=https://your-backend.vercel.app
VITE_RESEARCH_GRAPH=0x...
VITE_RESEARCH_TOKEN=0x...

# NO API KEYS IN FRONTEND!
```

---

## 📞 Security Contact

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security concerns to your team lead
3. Include detailed reproduction steps
4. Allow time for patch before disclosure

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)
- [Environment Variable Security](https://www.npmjs.com/package/dotenv#should-i-commit-my-env-file)

---

**Last Updated:** February 9, 2026  
**Version:** 1.0.0
