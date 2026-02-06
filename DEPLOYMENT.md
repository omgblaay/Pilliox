# Pilliox Deployment Guide 🚀

This guide covers deployment configuration for the Pilliox app with proper client-side routing support.

---

## Client-Side Routing Configuration

Pilliox uses client-side routing (React Router with History API) to handle legal pages (`/docs/terms` and `/docs/privacy`). This requires server-side configuration to ensure all routes serve the `index.html` file.

---

## Hosting Platforms

### Vercel (Recommended) ✅

**Configuration:** Already included in `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/docs/terms",
      "destination": "/index.html"
    },
    {
      "source": "/docs/privacy",
      "destination": "/index.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Deploy:**
```bash
npm install -g vercel
vercel
```

---

### Netlify ✅

**Configuration:** Already included in `public/_redirects`

```
/docs/terms /index.html 200
/docs/privacy /index.html 200
/* /index.html 200
```

**Deploy:**
1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

### Apache

Create a `.htaccess` file in your `dist` folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

### Nginx

Add to your nginx configuration:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

### Firebase Hosting

Add to `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

### AWS S3 + CloudFront

1. **S3 Bucket Configuration:**
   - Enable static website hosting
   - Set index document to `index.html`
   - Set error document to `index.html` (for SPA routing)

2. **CloudFront Configuration:**
   - Create a CloudFront distribution
   - Set custom error responses:
     - HTTP Error Code: 403
     - Response Page Path: `/index.html`
     - HTTP Response Code: 200
     - HTTP Error Code: 404
     - Response Page Path: `/index.html`
     - HTTP Response Code: 200

---

### GitHub Pages

GitHub Pages doesn't support server-side rewrites, so you'll need a workaround:

Create `404.html` in your `dist` folder that redirects to index.html:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Pilliox</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/index.html'">
  </head>
  <body></body>
</html>
```

Then in your `index.html`, add before closing `</body>`:

```html
<script>
  (function() {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect != location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

---

## Build Commands

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm install
npm run build
```

### Preview Production Build
```bash
npm run build
npm run preview
```

---

## Environment Variables

Make sure to set these environment variables in your hosting platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

For local development, create a `.env` file:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Testing Client-Side Routing

After deployment, test these URLs directly:

1. `https://yourdomain.com/` - Should show auth/calendar
2. `https://yourdomain.com/docs/terms` - Should show Terms of Service
3. `https://yourdomain.com/docs/privacy` - Should show Privacy Policy

If any of these return a 404, review your hosting configuration above.

---

## Troubleshooting

### Issue: 404 on direct URL access

**Solution:** Your hosting provider isn't configured to serve `index.html` for all routes. Review the configuration for your specific hosting platform above.

### Issue: OAuth redirect not working

**Solution:** Make sure your Supabase OAuth redirect URLs include your production domain:
- `https://yourdomain.com`
- `https://yourdomain.com/`

### Issue: Assets not loading

**Solution:** Check that your base URL is configured correctly in `vite.config.ts`. If deploying to a subdirectory, update the `base` option:

```typescript
export default defineConfig({
  base: '/your-subdirectory/',
  // ... rest of config
})
```

---

## Additional Resources

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router Deployment](https://reactrouter.com/en/main/start/tutorial#deploying)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth)

---

**Last Updated:** February 6, 2026 (v1.0.7)