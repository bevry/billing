# Prompts for Multiple entity emails and guest sign-in

Plan: [multiple-emails-and-guest-login.md](./1794070909107-multiple-emails-and-guest-login.md)
Harness: OpenCode
Provider: DeepSeek
Model: DeepSeek V4.1 Flash

## Initial prompt

The original prompt names an additional email address for Tip Stevens. That address becomes a strongbox data value, and `AGENTS.md` forbids quoting such values in a plan. The address is replaced with a description below.

Enable support for multiple emails per entity. Add the requested additional address for Tip Stevens as a valid additional email for Tip Stevens.

Send emails to unrecognised emails, so they can login, but see:

Welcome <email>,
you have no invoices.

Ensure emails are lowercase, and also sanitised as per RFC spec for email or whatever.

Do a plan before build.
