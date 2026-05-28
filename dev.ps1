$env:NODE_OPTIONS="--max-http-header-size=65536"
npx drizzle-kit push
if ($?) { next dev --webpack }
