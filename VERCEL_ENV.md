# Vercel Environment Variables

## Database (Supabase)
```
DATABASE_URL=postgresql://postgres.sewbmgqxbgigrmvdsykg:Laras040506Adit@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Redis
```
REDIS_USERNAME=default
REDIS_PASSWORD=P38Ylt1ZeD10NKoXJK3KEXJkVdeqSE73
REDIS_PREFIX=hr:
```

## SMTP (Email)
```
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aditya@pfigroup.id
SMTP_PASSWORD=Kontol123@
SMTP_FROM=aditya@pfigroup.id
SMTP_FROM_NAME=PeopleHub
```

## App
```
APP_NAME=PeopleHub
NODE_ENV=production
PORT=3001
```

## JWT (generate your own secrets)
```
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
```

## Frontend URL (for CORS)
```
FRONTEND_URL=https://peoplehub-frontend.vercel.app
```

---

## Copy-Paste Format for Vercel:

```env
DATABASE_URL=postgresql://postgres.sewbmgqxbgigrmvdsykg:Laras040506Adit@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
REDIS_USERNAME=default
REDIS_PASSWORD=P38Ylt1ZeD10NKoXJK3KEXJkVdeqSE73
REDIS_PREFIX=hr:
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=aditya@pfigroup.id
SMTP_PASSWORD=Kontol123@
SMTP_FROM=aditya@pfigroup.id
SMTP_FROM_NAME=PeopleHub
APP_NAME=PeopleHub
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://peoplehub-frontend.vercel.app
```
