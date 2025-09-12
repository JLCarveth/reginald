---
title: Packaging Deno Programs for Debian
author: John L. Carveth
publish_date: 2025-08-15
lang: en_GB
image: img/denobian-rounded.png
description: A guide on packaging Deno programs for Debian
---

<img src="/img/denobian-rounded.png" alt="Debian Logo | Deno Logo"/>

Lately, I find myself writing a lot of programs using the [Deno](https://deno.land) runtime, and I wanted an easier way to install these programs on various development and production environments. My development machine, local development server, as well as my production server all run Debian, so it made sense to learn how to package my programs *the Debian way*. 

This article will detail the steps I took to package a Deno program, resulting in a simple `.deb` file which can be installed on my machines with a single command. Doing it this way also facilitates updating and removing the software.

> **Note**: A password generator is not the best example, since spinning up the entire Deno runtime to generate a couple of strings is definitely overkill. These steps should be applicable to most Deno programs you would want to package. 

I will be taking advantage of `deno compile` to generate a single executable binary of our program for ease of installation. Something to note, though, is with this method, the binaries are certainly not *small*, as the binary includes the entire Deno runtime. For example, a simple "Hello World" executable is 82MB without doing any optimization, though the team has been [working to reduce this size.](https://deno.com/blog/v2.3#improved-deno-compile:~:text=In%20addition%2C%20deno%20compile%20now,test%20files%20from%20production%20builds.).

Keep in mind, this article will *not* cover publishing / distributing your `.deb` file.  It simply covers packaging a program for *private use*.

# Requirements
- The Deno runtime (only on the dev system, the target does not require `deno` to be installed)
- `build-essential`
- `devscripts`
- `debhelper`

Optionally:
- `dh-make`
- `fakeroot` which helps to simulate root privileges without requiring `sudo`
- `lintian` validates your files against Debian packaging policies

## Creating our files
You can use `dh_make` for this step if you installed it:
```bash
dh_make --single --copyright gpl3 --email "jlcarveth@gmail.com" --createorig -p genpass_0.1.0
```
If you want to create the files manually:
```bash
mkdir -p debian/

touch debian/changelog \
    debian/control \
    debian/rules \
    debian/copyright
```

If you used `dh_make`, there are some generated files that we won't be using, so let's remove them:
```bash
rm debian/*.ex
rm -rf debian/upstream
```

### The Control File
The `control` file defines package metadata and dependencies:
```
Source: genpass
Section: utils
Priority: optional
Maintainer: John Carveth <jlcarveth@gmail.com>
Build-Depends: debhelper (>= 10)
Standards-Version: 4.7.2
Homepage: https://github.com/JLCarveth/genpass
Vcs-Git: https://github.com/JLCarveth/genpass.git
Vcs-Browser: https://github.com/JLCarveth/genpass

Package: genpass
Architecture: amd64
Description: Simple password generator written in TypeScript
 A password generator offering two modes: memorable word-based passwords
 and random character passwords with configurable length. Written in
 TypeScript for the Deno runtime and compiled to a single binary.
 .
 Features include:
  - Word-based passwords using system dictionary
  - Random character passwords with customizable length
  - Option to exclude special characters
  - Multiple password generation in one command
```

Most of those fields should be straightforward enough, except perhaps `Standards-Version`. This is a mandatory field which tells the Debian build tools which version of the [Debian Policy Guide](https://www.debian.org/doc/debian-policy/) this package complies with. 

### debian/changelog
This file contains a summary of the changes to the Debian package. It follows a standard format, so if you didn't install `dh_make`, use `dch` which is included with the `devscripts` package to generate an initial changelog file:
```bash
dch --create -v 1.0-1 -u low --package genpass "Initial release."
```
### debian/copyright
The `copyright` file is a *machine-readable* file that specifies the legal rights to your package. Since the scope of this article is private Debian packaging, this file can remain blank. Though do keep in mind if you do want to include a license and you used `dh_make` to generate the files, the generated copyright file has some places you need to fill in.

### debian/rules
The `rules` file is a Makefile that tells the Debian build system how to compile and install your package. Our file follows a simple pattern: `dh $@` matches all of the rules by default, which we can then override specific steps as needed.

```
#!/usr/bin/make -f

  %:
        dh $@

  override_dh_auto_configure:
        # Download and install Deno locally if not available
        if ! command -v deno >/dev/null 2>&1; then \
                mkdir -p $(DENO_DIR); \
                curl -fsSL https://deno.land/install.sh | DENO_INSTALL=$(DENO_DIR) sh; \
        fi

  override_dh_auto_build:
        # Compile the Deno program to a standalone binary
        if [ -d "$(DENO_DIR)" ]; then export PATH="$(DENO_DIR)/bin:$PATH"; fi; \
        deno task compile

  override_dh_auto_install:
        # Install the compiled binary to the package directory
        mkdir -p debian/genpass/usr/bin
        cp genpass debian/genpass/usr/bin/

  override_dh_strip:
        # Skip stripping - Deno binaries contain embedded resources
```

The `%` target with `dh $@` is the modern dephelper approach; it automatically handles configuration, building, testing, and installation. We override specific steps: `configure` ensures the Deno runtime is available, `build` compiles the program using `deno compile`, `install` to place the binary in the correct location, and `strip` the binary to ensure it works on the installed system. This [issue](https://github.com/denoland/deno/issues/22556) on the Deno repo further expands on the need to strip the binary.

# Building the Package
Now, we should have all of the required files to build our Debian package:
```
dpkg-buildpackage -us -uc
```
The `-us -uc` flags simply skip signing the source package and .changes file respectively. Since this is a private package and won't be shared widely, there is no need to setup GPG keys or go through the signing process. 

You should now have a `genpass_0.1.0-1_amd64.deb` file in the *parent directory*. You can now copy this `.deb` package to your target machine and install it with `sudo dpkg -i ./path/to/genpass_0.1.0-1_amd64.deb`

## Some Helpful Resources
- https://wiki.debian.org/Packaging/
- https://www.debian.org/doc/debian-policy/
- https://www.debian.org/doc/manuals/maint-guide/dreq.en.html
- https://github.com/denoland/deno/issues/22556

