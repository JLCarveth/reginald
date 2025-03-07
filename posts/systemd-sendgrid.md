---
title: Setting Up Systemd Email Notifications with SendGrid 
author: John L. Carveth
publish_date: 2025-01-24
---

After a recent service outage that went unnoticed longer than I'd like to admit, I decided to set up automatic email notifications for any systemd service failures. Here's how I accomplished this using systemd and SendGrid.

## The Setup

The solution consists of three components:

1. A top-level systemd drop-in that triggers on any service failure
2. A template unit that handles the notification process
3. A bash script that sends the actual email via SendGrid's API

## Implementation

First, create a top-level drop-in configuration that applies to all services:

```ini
# /etc/systemd/system/service.d/toplevel-override.conf
[Unit]
OnFailure=failure-notification@%n
```

This configuration tells systemd to trigger our notification service whenever any service fails. The `%n` parameter passes the failed service's name to our notification template.

Next, create the template unit that will handle sending notifications:

```ini
# /etc/systemd/system/failure-notification@.service
[Unit]
Description=Send an email notification whenever a service fails
After=network.target

[Service]
Type=Simple
Environment="SENDGRID_API_KEY=YOUR_API_KEY_HERE"
ExecStart=/usr/local/bin/failure-notification.sh %i
```

Finally, create the notification script:

```bash
# /usr/local/bin/failure-notification.sh
#!/bin/bash

SERVICE_NAME=$1

curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header "Authorization: Bearer $SENDGRID_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "personalizations": [{"to": [{"email": "your.email@domain.com"}]}],
    "from": {"email": "your.email@domain.com", "name": "System Monitor"},
    "subject": "A Systemd service has failed",
    "content": [{"type": "text/plain", "value": "Service '"$SERVICE_NAME"' has failed. Please investigate."}]
  }'
```

Don't forget to make the script executable:

```bash
chmod +x /usr/local/bin/failure-notification.sh
```

## Preventing Notification Loops

One crucial detail: we need to prevent potential notification loops where the notification service itself could fail and trigger another notification. Create an empty drop-in configuration file with the same name as the top-level drop-in:

```ini
# /etc/systemd/system/failure-notification@.service.d/toplevel-override.conf
# This empty file overrides the top-level drop-in
```

This empty service-level drop-in takes precedence over the top-level configuration, effectively preventing the notification service from triggering itself.

## Testing

You can test the setup by intentionally failing a service:

```bash
systemctl start test-service
systemctl kill test-service
```

## Security Notes

Remember to:

* Store your SendGrid API key securely
* Use environment variables instead of hardcoding credentials
* Consider implementing rate limiting to prevent notification storms
* Monitor your SendGrid API usage to stay within limits

This setup has already saved me from several potential extended outages by alerting me immediately when services fail. The implementation is simple but effective, leveraging systemd's built-in capabilities alongside SendGrid's reliable email delivery service.
