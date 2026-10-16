# JJ Ledger Demo

A standalone, browser-only demo of OneLedger Pro. No Supabase, Cloudinary,
email service, production credentials, or environment variables are required.

## Run locally

Use Node 22.12 or newer, then run `npm ci` and `npm run dev`.
Build with `npm run build`; output is in `dist`.

## Demo access

| Role | Demo passcode |
| --- | --- |
| Owner | owner-local |
| Staff | staff-local |
| View | view-local |

These public passcodes demonstrate the screens; they are not secure authentication.
Use fictional data only. Each browser has independent data. Clearing browser storage
removes its demo records. There is no cloud backup or cross-device sync.

## Included

- Customers and retail, bullion, silver and chit transactions
- Optional manual bill numbers and ledger search
- Balances, dues, receipts and Excel exports
- Compressed property photos stored on the device
- Role-based demo screens and 50 sample customers and 109 transactions via Settings → Load Dummy Data
- Local persistence after refreshing; separate storage keys from OneLedger Pro

## Hosting

Connect this repository to a separate Netlify demo project, using build command
`npm run build` and publish directory `dist`. The included configuration sets these.
No external-service keys are needed. Do not point the production ledger project here.

## Checks

`npm run lint`, `npm run build`, and `npm run test:smoke` (uses installed Chrome).
