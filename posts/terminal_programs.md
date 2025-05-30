---
title: Four Command-Line Tools Boosting My Productivity
author: John L. Carveth
publish_date: 2025-05-30
---

They always say a man is only as good as his tools, and that remains true in the world of computing. As I gain more experience in the terminal, I've discovered some powerful utilities which have vastly improved my productivity and developer experience. 

## Better Shell History Lookup
The first program I would like to direct your attention to is [fzf](https://github.com/junegunn/fzf). `fzf` is a *fuzzy finder*, meaning it doesn't search for exact matches, but instead ranks results based on how similar they are to the search term. A particularly useful feature of `fzf` that I use every day is it's *shell integration*. If you use `bash`, this is as simple as adding the following line to your `~/.bashrc`:

```shell
eval "$(fzf --bash)"
```
In most terminals, Ctrl-R allows you to search your shell *history*, showing all commands you have executed in the past. This isn't ideal, as the built-in history search only ever shows one result, and also requires an *exact match*. With `fzf` however, you can see multiple matching results and can easily select the one you want. 

In a similar vein, pressing `Alt-c` allows you to quickly search for a directory and `cd` into it. This is an incredible time saver, as you can quickly jump to any directory with just a handful of keystrokes. 

## Data Visualization
I tend to do a lot of work with data in different formats, but most commonly in `CSV` or `JSON`.   
To work with these formats, I use [csvlens](https://github.com/YS-L/csvlens) and [fx](https://github.com/antonmedv/fx) respectively. Both support vim-style keybindings as well, so I can take advantage of my muscle memory to quickly navigate the data. `csvlens` provides an interactive table view of CSV files with features like sorting, filtering, and search - far superior to scrolling through raw data in a text editor. Meanwhile, `fx` transforms JSON exploration from a tedious task into an interactive experience, allowing you to navigate nested structures, apply transformations, and extract specific values with ease. Both support vim-style keybindings as well, so I can take advantage of my muscle memory to quickly navigate the data. 

## Markdown
[glow](https://github.com/charmbracelet/glow) is an excellent markdown viewer written in Go. In fact, I used `glow` while writing this article, via a `:terminal` window in my NeoVim editor. Beyond simple file viewing, `glow` can also browse and search your local markdown files, and even fetch and display markdown content from URLs, making it invaluable for quickly reviewing project documentation without leaving the terminal. 

## Conclusion
These four tools have become essential parts of my daily workflow. `fzf` makes navigating my shell history and filesystem effortless, `csvlens` and `fx` turn data exploration into a pleasant experience, and `glow` keeps me in the terminal when reviewing documentation. The best part? They all integrate seamlessly with existing workflows without requiring you to learn entirely new paradigms. If you spend significant time in the terminal, I highly recommend giving these utilities a try.
