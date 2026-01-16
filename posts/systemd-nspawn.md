---
title: 
author: John L. Carveth
publish_date: 2026-01-16
lang: en_GB
description: A guide on using `systemd-nspawn` to setup dev containers
---

My desktop PC predates my love for Debian, so it's still running Arch Linux. I ran into an issue the other week while working from home while trying to build a Debian package:

```bash
❯ make package
Cleaning build artifacts...
rm -rf debian/cassandra
rm -rf debian/.debhelper
rm -rf debian/files
rm -f debian/cassandra.debhelper.log
rm -f debian/cassandra.substvars
rm -f debian/*.log
rm -f ../*.deb
rm -f ../*.buildinfo
rm -f ../*.changes
Building Debian package...
dpkg-buildpackage -us -uc -b
dpkg-buildpackage: info: source package cassandra
dpkg-buildpackage: info: source version 0.1.0-3
dpkg-buildpackage: info: source distribution unstable
dpkg-buildpackage: info: source changed by John L. Carveth <johnc@eastelectricalsupply.com>
dpkg-buildpackage: info: host architecture amd64
 dpkg-source --before-build .
dpkg-checkbuilddeps: error: unmet build dependencies: debhelper-compat (= 13)
dpkg-buildpackage: error: build dependencies/conflicts unsatisfied; aborting
dpkg-buildpackage: hint: satisfy build dependencies with your package manager frontend
make: *** [Makefile:38: package] Error 3
```

`debhelper-compat ( =13)` is not satisfied on Arch because Arch does not provide Debian's `debhelper` compatibility system, even if `debhelper` is installed from AUR. Instead, we can take advantage of `systemd-nspawn` to spin up a Debian container. The ArchWiki actually has [an example](https://wiki.archlinux.org/title/Systemd-nspawn#Create_a_Debian_or_Ubuntu_environment) on how to do this.

`systemd-nspawn` is a lightweight container tool that comes built-in with systemd. Think of it as similar to Docker or Podman, but more tightly integrated with systemd and ideal for running full Linux distributions in isolated environments. Unlike virtual machines, containers share the host kernel, making them fast to start and resource-efficient—perfect for development tasks like building packages.

Let's start by creating a directory where our image's filesystem will be stored.

```bash
sudo mkdir -p /var/lib/machines/debian
```

This is one of `systemd-nspawn`’s default and preferred locations for container root filesystems. When using `machinectl` or `systemd-nspawn` without explicitly specifying an image path, systemd will automatically look in `/var/lib/machines` for available containers. With our directory created, we can now populate our file tree using `debootstrap`. Thankfully, this is packaged for arch linux, so we can install it easily:

```bash
sudo pacman -S debootstrap debian-archive-keyring
sudo debootstrap --arch=amd64 --include systemd,build-essential,debhelper,devscripts,dh-make,fakeroot,lintian trixie /var/lib/machines/debian
```

This command bootstraps our initial Debian filesystem to `/var/lib/machines`, which is one of the default search paths used for machine images. The `--include` flag allows `debootstrap` to download and install additional software when creating the OS file tree. I've included common software required for building Debian packages. 

Now, we should see a valid linux filesystem in `/var/lib/machines/debian`:
```
❯ ll /var/lib/machines/debian
total 72K
drwxr-xr-x 18 root root 4.0K Nov 14 12:34 .
drwxr-xr-x  3 root root 4.0K Nov 14 12:28 ..
lrwxrwxrwx  1 root root    7 Aug 24 12:20 bin -> usr/bin
drwxr-xr-x  2 root root 4.0K Aug 24 12:20 boot
drwxr-xr-x  2 root root 4.0K Nov 14 12:29 debootstrap
drwxr-xr-x  4 root root 4.0K Nov 14 12:29 dev
drwxr-xr-x 59 root root 4.0K Nov 14 12:29 etc
drwxr-xr-x  2 root root 4.0K Aug 24 12:20 home
lrwxrwxrwx  1 root root    7 Aug 24 12:20 lib -> usr/lib
lrwxrwxrwx  1 root root    9 Aug 24 12:20 lib64 -> usr/lib64
drwxr-xr-x  2 root root 4.0K Nov 14 12:29 media
drwxr-xr-x  2 root root 4.0K Nov 14 12:29 mnt
drwxr-xr-x  2 root root 4.0K Nov 14 12:29 opt
drwxr-xr-x  2 root root 4.0K Aug 24 12:20 proc
drwx------  3 root root 4.0K Nov 14 12:29 root
drwxr-xr-x  9 root root 4.0K Nov 14 12:29 run
lrwxrwxrwx  1 root root    8 Aug 24 12:20 sbin -> usr/sbin
drwxr-xr-x  2 root root 4.0K Nov 14 12:29 srv
drwxr-xr-x  2 root root 4.0K Aug 24 12:20 sys
drwxrwxrwt  2 root root 4.0K Nov 14 12:29 tmp
drwxr-xr-x 12 root root 4.0K Nov 14 12:29 usr
drwxr-xr-x 11 root root 4.0K Nov 14 12:29 var
```

The next step is to somehow expose my project directories to the Debian container. We can do this with bind mounts. Let's create a `.nspawn` file to manage our machine:

```
sudo vim /etc/systemd/nspawn/debian.nspawn
```

```
[Files]
Bind=/home/jlcarveth/Developer:/mnt
```

Now, we should be able to boot into our container: 
```
sudo systemd-nspawn -D /var/lib/machines/debian
```

Once inside the container, we can set the root password and create a new user. I like to use the same username as on my host machine to keep things simple:
```bash
sudo systemd-nspawn -D /var/lib/machines/debian
passwd root  # Set root password
useradd -m -s /bin/bash jlcarveth
passwd jlcarveth
```
With our user properly setup, we can now log in directly as that user:
```bash
sudo systemd-nspawn -D /var/lib/machines/debian --user=$USER
```

Using `systemd-nspawn -D` is *ephemeral*, when you exit the container, it shuts down. This is ideal for my usecase of building debian packages. If you needed the container to be persistent, for example when testing a web server, you can use `machinectl`:

```bash
sudo machinectl start debian
sudo machinectl login debian
```

After running `machinectl start`, assuming the container did not run into issues, you should be able to see the container with `machinectl list`. If you do not see the container listed, then an error occurred while starting the machine. You can use `journalctl` to examine the logs:

```bash
sudo journalctl -fe -u systemd-nspawn@debian.service
```

With systemd-nspawn, you can maintain a clean separation between your Arch host system and Debian build environment without the overhead of full virtualization. The ephemeral nature of systemd-nspawn -D means each build starts fresh, while the bind mount gives you seamless access to your project files. Whether you're building Debian packages, testing software in different distributions, or just need an isolated development environment, systemd-nspawn provides a elegant solution that's already installed on most systemd-based distributions.
