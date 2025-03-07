---
title: Monitoring a Directory with Systemd
publish_date: 2022-08-11
author: John L. Carveth
---
I've been using Linux as my daily driver OS for a couple of years now, but it's only recently that I started using Linux everyday as a part of my job. A lot of those days, I find myself using `systemd`. It's wonderful. I can manage software deployments, schedule tasks, listen to network sockets, and as the title of this article suggests I can use systemd to monitor a certain path for changes.

The server is running a small piece of reporting software, which listens for HTTP requests and generates reports in an HTML format. These `.html` files are written to the server once they are generated. I wanted a script to execute each time a new report was written to that directory in order to convert that html into a `.pdf` and subsequently print the file. There are a few pieces involved in getting a workflow like this to work. This article will only cover using systemd to monitor for changes.

We'll start by writing the shell script we want systemd to execute.
```
#!/bin/sh

WORKING_DIR=/opt/spinv-backend/reports
REPORT_FILES=$WORKING_DIR/*.html

for file in $REPORT_FILES;
do
        filename=$(basename -- "$file");
        filename="${filename%.*}"
        printf "Converting $filename to $filename.pdf\n";
        # Convert .html file to .pdf
        wkhtmltopdf $file $WORKING_DIR/pdf/$filename.pdf

        # Send .pdf to print queue
        printf "Sending $filename.pdf to print queue...\n"
        lp $WORKING_DIR/pdf/$filename.pdf
        # Move .html file to archive so not printed twice
        mv $file $WORKING_DIR/archive/
        printf "$file done\n"
done;
```

Fairly straight-forward, this script loops through the `/opt/spinv-backend/reports` directory over any file ending in `.html`. This file is then converted and sent to the print queue using `wkhtmltopdf` and `CUPS` respectively.

How, we need a service file (let's call it `report.service`) that runs this script:
```
[Unit]
Description=Converts and prints spire-inventory reports.

[Service]
Type=OneShot
ExecStart=/opt/spinv-backend/printReports.sh

[Install]
WantedBy=multi-user.target
```
That's all that's needed for the base service. We still need another service unit that monitors the path. It will have the same name as the service file we just created, only with a `.path` extension instead of `.service`:
```
[Unit]
Description=Monitor /opt/spinv-backend/reports for changes.

[Path]
PathChanged=/opt/spinv-backend/reports/
Unit=report.service

[Install]
WantedBy=multi-user.target
```

Now that we have the necessary service files, all that's left is symlinking our service files to `/etc/systemd/system` and then start them.
```
sudo ln -s /opt/spinv-backend/report.service /etc/systemd/system/report.service
sudo ln -s /opt/spinv-backend/report.path /etc/systemd/system/report.path

sudo systemctl enable report.{path,service}
sudo systemctl start report.path
```

That's it!