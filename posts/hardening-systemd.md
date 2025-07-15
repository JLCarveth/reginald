---
title: Hardening systemd Services
author: John L. Carveth
publish_date: 2025-07-11
lang: en_GB
image: img/hardening.jpg
description: A simple guide on hardening systemd services.
---

My love for `systemd` is no secret, I've blogged about it more than once. I especially love systemd's ability to *harden* services. What does this mean exactly? Systemd offers a wealth of [directives](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html) that can restrict a service's access to files, syscalls, or even the network. This gives me peace of mind, knowing that even if the software running in the service has a vulnerability, the rest of the system stays protected.

# The Hardening Loop
Hardening a systemd service isn't a one-shot task. It's an iterative process:
  1. Add one (or a few) directives to your `.service` file.
  2. Reload the systemd daemon and restart your service
```bash
sudo systemctl daemon-reload
sudo systemctl restart example.service
```
  3. Verify the service still works. 
  4. Repeat until the service is satisfactorily locked down.

# The Security Score
There is an optional step between 3) and 4): using `systemd-analyze security <service-name>`. This command displays a table showing various directives, whether they've been applied to your service, and the potential security score improvement if a directive has yet to be applied. At the bottom of this output, you will see the total score for your service. Lower is better. 

# Why Bother?
Without hardening our services, a compromised service can become a gateway for attackers. Imagine a web server with a remote code execution flaw: if the service runs with full privilleges, an attacker could read sensitive files, modify system configurations, or even spread to other machines on the network. 

But with proper hardening we gain:
- Filesystem isolation
- Network isolation
- System call filtering

With hardened systemd services, we can more effectively contain potential breaches.
