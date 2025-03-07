---
title: Systemd Units vs Docker Containers - Why I Choose the Former for Running Services 
author: John L. Carveth
publish_date: 2023-05-03
---
Docker is a great tool for building and running containerized applications, but it is not the best solution for running services on Linux. In this post, I will explain why I prefer using systemd units over Docker containers for running services on Linux, based on three criteria: simplicity, integration, and reliability.

## Simplicity

Docker simplifies the process of creating and deploying applications, but it also adds complexity and overhead when it comes to running services. You need to install and run the Docker daemon, deal with networking and storage issues, and learn how to use various Docker tools and commands. Moreover, you need to install Docker separately on your system, as it is not included in most Linux distributions by default.

Systemd units are much simpler and more lightweight. You just need to write a systemd unit file that describes your service, and then use systemctl commands to manage your service. You don’t need to install or run any extra software or daemon. You don’t need to worry about networking or storage issues, as systemd handles them for you using standard Linux mechanisms. Moreover, you don’t need to install systemd separately on your system, as it is already installed on most Linux distributions by default.

## Integration

Docker provides a high level of integration with other tools and platforms, but it also creates integration problems when it comes to running services on Linux. Docker does not integrate natively with its host OS and init system (such as systemd), but rather creates its own environment and processes that are isolated from the rest of the system. This can be advantageous in many scenarios, but it also means that you cannot use standard Linux tools and commands to interact with your containers or monitor their status.

Systemd units integrate seamlessly with the host OS and init system. You can use the same tools and commands that you use for managing your system and services. You can also leverage the features and capabilities of systemd, such as timers, sockets, cgroups, environment files, drop-in files, etc.

```
# Enable the service to start automatically on boot
sudo systemctl enable my-service.service

# Start the service
sudo systemctl start my-service.service

# Stop the service
sudo systemctl stop my-service.service

# Restart the service
sudo systemctl restart my-service.service

# Reload the service configuration
sudo systemctl reload my-service.service

# Check the status of the service
sudo systemctl status my-service.service
```

`journalctl` can be used to monitor independent services:
```
# View the logs of the service
sudo journalctl -u my-service.service

# View the logs of the service since the last boot
sudo journalctl -u my-service.service -b

# View the logs of the service in real time
sudo journalctl -u my-service.service -f
```

## Reliability

Docker provides a high level of reliability and availability for applications, but it also introduces reliability issues when it comes to running services on Linux. Docker containers depend on the Docker daemon, which is a single point of failure for all the containers on a system. If the Docker daemon crashes or hangs, all the containers will stop working until the daemon is restarted. Moreover, Docker daemon updates may require restarting all the containers on a system, which may cause downtime or disruption for the applications.

Systemd units are more robust and resilient than Docker containers for running services. Systemd units do not depend on any external daemon or process, but rather run directly under systemd's supervision. If systemd crashes or hangs, it will automatically recover and resume all the services without any intervention. Moreover, systemd updates do not require restarting any services on a system, unless they explicitly depend on systemd itself.

In conclusion, I prefer using systemd units over Docker containers for running services on Linux because they are simpler, more integrated, and more reliable. I think that Docker is a great tool for building and running containerized applications, but it is not the best solution for running services on Linux. Systemd units are more suited for this purpose, as they leverage the native features and capabilities of Linux.
