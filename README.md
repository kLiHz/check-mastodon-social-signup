# Check mastodon.social signup

Check signing up availability for [mastodon.social](https://mastodon.social)
by the response code of <https://mastodon.social/auth/sign_up>.

## Cron Notify via Cloudflare Workers

Create a Cloudflare worker, click Quik Edit and use content in
[worker.js](./worker.js).

Then disable any route for this worker, just use Cron triggers.

Need to set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Environment
Variables.

## Cron Notify via GitHub Action

[.github/workflows/check-and-notify.yml](.github/workflows/check-and-notify.yml)

Need to set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in
[repository secrets](repo-secrets).

[repo-secrets]: https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository
