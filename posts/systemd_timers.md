---
title: Scheduling Tasks with Systemd Timers
publish_date: 2022-07-25
author: John L. Carveth
---
I have been using `systemd` to manage services on my many Linux boxes for a while now. Compared to writing [initd](https://gist.github.com/drmalex07/298ab26c06ecf401f66c) scripts, systemd service files are dead simple.  
  
Recently, I needed to setup a backup solution for a new linux box being setup at work. This server was running Ubuntu Server 22.04, which comes with `systemd 249 (249.11-0ubuntu3.4)` out of the box.

Our ideal backup solution would backup only the necessary files at a regular interval. The backup would be stored to an external disk as well as sent to a remote server off-site. Thankfully, we can configure our systemd service to depend upon a specific mount point, meaning the script will only run if the proper disk is connected to the server.

Two unit files are needed to accomplish our goal, in additon to a shell script:
- `backup.service` - This is the service that will run our backup script.
- `backup.timer` - The timer that activates and controls the service unit.
- `backup.sh` - The script that actually handles the backup.

I went ahead and stored all three files within their own directory under `/opt/`.
Let's take a look at `backup.timer`:
```
[Unit]
Description=Timer unit for backup.service
Requires=backup.service

[Timer]
Unit=backup.service
OnCalendar=daily

[Install]
WantedBy=multi-user.target
```
Quite a simple file, with only five important lines. `Requires` specifies that `backup.timer` relies on `backup.service` in order to run correctly. Within the `[Timer]` section, `Unit` specifies the service to run on schedule, and `OnCalendar` specifies the frequency at which the service will run. Our timer will execute `backup.service` *daily*.  

One thing I learned while setting up this timer unit is the difference between *timespan* and *timestamps*. `OnCalendar` expects a *timestamp* value, such as `daily` or another value such as:
- minutely, hourly, daily
- 2022-07-26 12:00:00
- Mon,Fri *-01/2-01,03 *:30:45

However, what if you want the script to run every 30 minutes? In that case, we'd use a *timespan*. [This page](https://man.archlinux.org/man/systemd.time.7.en) from the Arch Linux manual covers the timespan format quite well.

Examining `backup.service` shows a similarly simple unit file:
```
[Unit]
Description=SystemBackup
Wants=backup.timer
After=media-jlcarveth-JLCT7.mount

[Service]
Type=oneshot
ExecStart=/opt/backup/backup.sh

[Install]
WantedBy=multi-user.target
```
This service will only run once another service `media-jlcarveth-JLCT7.mount` has finished running, meaning the disk has been mounted. This service runs once, as specified by `OneShot`, and simply executes a shell script.

Finally, let's take a look at our backup script, `backup.sh`:
```
#!/bin/sh
# File containing paths to backup
TARGETS="/opt/backup/to_backup"
# Create a new dated directory for the backup
BACKUP_DEST="/opt/backup/current"
mkdir -p $BACKUP_DEST

while read line;
do
        include_args="${include_args} ${line}"
done <$TARGETS;

# Execute the rsync command
#       -a : Archive mode, keeps file properties intact
#       -L : Copy links, transform symlinks into referent file / dir
#       -v : Verbose mode
#       -R : Relative mode, use relative path names
/usr/bin/rsync -aLvR ${include_args} $BACKUP_DEST

printf "Backup Completed $(date +%FT%r)\n" >> /opt/backup/history.log
```
Again, dead simple. This script reads each line from a file `to_backup` which contains absolute paths to each directory/file I wish to backup. These paths are appended to an argument that is then passed to rsync.
The result is a folder `current/` containing a perfect mirror of all those directories previously specified. The next time rsync runs, it will also execute quicker as it doesn't need to copy each file and can simply compare them.  

---
## Sources, Additional Reading
- https://www.freedesktop.org/software/systemd/man/systemd.timer.html
- https://man.archlinux.org/man/systemd.time.7