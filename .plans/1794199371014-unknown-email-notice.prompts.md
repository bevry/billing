# Prompts for Unknown email notice instead of guest sign-in

Plan: [unknown-email-notice.md](./1794199371014-unknown-email-notice.md)
Harness: OpenCode
Provider: DeepSeek
Model: DeepSeek V4.1 Flash

## Follow-up prompt

I've changed my mind, instead of allowing unrecognised emails to login, just send them an email of:

Subject: Your login to billing.bevry.me
Body:

```
Your email <email> was recently used to try to login to:
https://billing.bevry.me

However, your email is not attached to any invoices in our system!

Perhaps your invoices are attached to a different email, in which case, inform us via our existing communication channel as to your new email, such that we can update our system to attach your invoices to your new email.

Do not reply to this email.
```
