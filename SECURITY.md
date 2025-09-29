# FuckingNode Security Policy

Keeping software secure can be a fucking headache. While this CLI tool might look like a simple automating tool, it ships to production with access to filesystem read and write, environment variable access, networking access, command execution access, and system information access, so **security is actually important**.

## Reporting a Vulnerability

If you find a security vulnerability, you should do one of the following:

- If you simply found what can be considered a SECURITY issue, contact us privately through [Discord](https://discord.com/users/807903704472223754). We'll work on a patch and release it as soon as possible.
- If you found an issue AND you know how and want to fix it yourself - first, thank you! - and second, contact us with the fix rather than making a public fork and a public PR. Security issues must be kept secret to avoid exploiting. You will be acknowledged as a contributor for your help, don't worry.

### Supported Versions

This section is here for redundancy, as this isn't some large-scale project with "v20" and "v19" being both supported. We don't like this bureaucratic way of thinking where different versions get patched, as it gives us more work and can actually make it harder and slower to get issues resolved. So, as soon as 1.2.3 drops, 1.2.2 is unsupported, and as soon as 2.X drops, 1.X is unsupported. Period.
