---
title: Using the Clipboard from the Command Line
author: John L. Carveth
publish_date: 2025-05-26
lang: en_GB
---

This will be a brief post, but I wanted to share some helpful aliases I use every single day:

## Prerequisites
These aliases make use of `xclip`, which is not usually included by default in most Linux distributions. Make sure it's installed:

```bash
sudo apt-get install xclip # Debian/Ubuntu

sudo dnf install xclip # Fedora

sudo pacman -S xclip # Arch Linux
```

## The Aliases

```bash
alias pbcopy='xclip -r -selection clipboard'
alias pbpaste='xclip -selection clipboard -o'
alias pbedit='pbpaste > /tmp/clipboard-edit.txt && $EDITOR /tmp/clipboard-edit.txt && cat /tmp/clipboard-edit.txt | pbcopy && rm /tmp/clipboard-edit.txt'
```

The first two should be quite familiar if you've ever used macOS; `pbcopy` allows you to pipe any data into the clipboard to be copied, whereas `pbpaste` outputs the contents of the clipboard, allowing the user to pass clipboard content directly to another program. 

For example, here is how I copied the aliases to my clipboard:
```bash
cat ~/.oh-my-zsh/custom/aliases.zsh | grep pb | pbcopy
```
(This is specific to my setup, check your distribution for where you should store aliases.)

Using `pbpaste` to interact with the clipboard contents is just as straightforward:
```bash
pbpaste | less
```

The real helpful alias is the last one, `pbedit` is not an available command by default on macOS. This allows you to edit the current contents of your clipboard with your favourite `$EDITOR`, and saves the edited data to the clipboard once the editor is closed. 

**Note:** The $EDITOR environment variable is used by the system to determine which program is to be used when editing text files. You can see what $EDITOR is set to by running `echo $EDITOR`. If $EDITOR is not set, you can `export` your editor of choice: `export EDITOR=vim`

These commands even work over `ssh`, assuming the following are true:  
- `xclip` (and your editor with clipboard support) are X applications that need to communicate with an X server. You enable this communication by making sure that ForwardX11 is set to true, either by using the -X flag or by setting ForwardX11 yes in your ssh configuration.
- Your editor needs to be compiled with clipboard support. In the case of `vim`, you can check this by running `vim --version | grep clipboard`. If you see `+clipboard`, you should be good to go. (**hint**: if clipboard support is not enabled in the binary you are using, try `vim-gtk` instead)

