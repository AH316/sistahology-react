# Vercel Cache Prevention Headers

To prevent auth session caching issues in preview deployments, add these headers to your Vercel configuration.

## vercel.json

```json
{
  "headers": [
    {
      "source": "/",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/(dashboard|profile|calendar|search|new-entry)(.*)",
      "headers": [
        {
          "key": "Cache-Control", 
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

## Alternative: _headers file

Create `public/_headers` file:

```
/*
  Cache-Control: no-cache, no-store, must-revalidate

/dashboard/*
  Cache-Control: no-cache, no-store, must-revalidate
  
/profile/*
  Cache-Control: no-cache, no-store, must-revalidate
  
/calendar/*
  Cache-Control: no-cache, no-store, must-revalidate
  
/search/*
  Cache-Control: no-cache, no-store, must-revalidate
  
/new-entry/*
  Cache-Control: no-cache, no-store, must-revalidate
```

## Purpose

These headers prevent Vercel from caching:
- Auth-sensitive pages in preview deployments
- Static assets that might contain stale session data
- API responses that depend on authentication state

Combined with environment-specific storage keys in `supabase.ts`, this ensures clean auth state between deployments.