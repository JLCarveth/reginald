---
title: Bringing the Power of an IDE to the Terminal
publish_date: 2023-01-13
author: John L. Carveth
---
Recently, I decided to take the plunge and switch from my usual editor-of-choice, VSCode, to the terminal-based Neovim. 
I had already been using the terminal for more and more things in my day-to-day workflow, and I had a sense of the power and efficiency it offered.
It was only when I read [a comment](https://news.ycombinator.com/item?id=33209020) on a Hackernews thread about "living in the terminal" that I decided to take the plunge. That comment fascinated me, and I needed to find out exactly how a terminal-based text editor could come even close to the feature-set offered by my at-the-time favorite IDE. The promise of sub-100ms start-times was the cherry on top.

## Getting a Plugin Manager
There are *plenty* of Neovim plugin managers to choose from, and I'll be honest; I didn't spend all too long deciding which plugin manager to use. From my initial glances at the most frequently suggested solutions, they all offered similar functionality. I chose to use [packer](https://github.com/wbthomason/packer.nvim), though [vim-plug](https://github.com/junegunn/vim-plug) is another popular option. Installing packer is incredibly simple, only involving cloning the repository.

Now, we will write our plugin specification, I stored mine as suggested in `~/.config/nvim/lua/plugins.lua`. Later on, we will store additional lua configuration files within the `lua/` directory.
```lua
-- This is required if you have packer configured as `opt`
vim.cmd [[packadd packer.nvim]]

return require('packer').startup(function(use)
  -- Packer manages itself
  use 'wbthomason/packer.nvim'
end)
```
This is the barebones configuration needed to get packer working with neovim. In the following section we will look at adding additional plugins to our neovim setup.

## Plugins
### Conquer of Completion (CoC)
Nvim actually comes with a Language Server Protocol (LSP) client [out-of-the-box](https://neovim.io/doc/user/lsp.html) and it is quite capable. However while the built-in client offers code *completion*, I specifically wanted *auto-completion*, and the native client could not achieve that without an additional plugin and further configuration. Because of this, I chose to install [Conquer-of-Completion]() as it requires minimal configuration for a good experience out of the box.

### auto-session
In my day-to-day workflow, I am constantly closing and reopening vim in different directories. `auto-session` is a neovim session manager which allows for seamless session restoration. Once installed, starting nvim with no arguments will cause `auto-session` to restore the session from the current working directory. Installing `auto-session` is as simple as modifying the `plugins.lua` file created in the previous step:
```Lua
use {
  'rmagatti/auto-session',
  config = function()
    require("auto-session").setup {
      log_level = "error",
      auto_session_suppress_dirs = { "~/", "~/Projects", "~/Downloads", "/"},
    }
  end
}
```
Now whenever you run `nvim` without any additional arguments, auto-session will look for an existing session in your current working directory and will try to restore it. 

### lualine
[lualine](https://github.com/nvim-lualine/lualine.nvim) is a handy statusline plugin for Neovim. Easily customizable, lualine shows helpful information such as the current vim mode and the git branch you are working on.  

### Nightfox
There are plenty of themes available for Neovim, so pick one you like. I chose EdenEast's collection of themes [nightfox](https://github.com/EdenEast/nightfox.nvim) because of the availablility of light and dark themes, as well as additional theme files for Kitty, tmux, and more. I also configured nvim to pick the colorscheme based on the time of day:
```
if strftime("%H") < 18
  colorscheme dawnfox
else
  colorscheme nightfox
fi
```

### Telescope
When I first started using Neovim, I tried to emulate the experience I had in VSCode. That meant using NetRW or NerdTREE to display a "file-picker" to the left of my open buffer. This worked relatively well, though switching between the file picker and the buffer constantly was tedious, and having open two buffers in a vertical split made things tight for space. So instead I opted to use [telescope.nvim](https://github.com/nvim-telescope/telescope.nvim). Telescope is a *fuzzy-finder* which allows for rapid searching and selection of files in your project directory. I like to set my leader key to 89, meaning that a telescope window can be opened by quickly pressing '89ff'.

## Terminal Multiplexing
Now I had a neovim configured how I liked it, but there was still one thing missing from my VSCode experience: an easy-access terminal. 
Of course, you could use the terminal thats built right into vim (`:Terminal`), but personally I prefer the extra flexibility of having a full terminal that exists outside of the neovim instance. For this I decided to use [Tmux](https://github.com/tmux/tmux/wiki). 
Tmux is a *terminal multiplexer* meaning it facilitates managing multiple terminal panes from a single window. Kitty, the terminal I tend to use day-to-day, already supports splits and panes, so why use Tmux? For one thing, I do sometimes switch terminal emulators. I like to use Alacritty which does *not* support panes, so I find it easier to use tmux. In addition, I use [tmuxinator](https://github.com/tmuxinator/tmuxinator) to manage sessions and layout using Tmux.

### Custom Layouts
One powerful feature of tmuxinator is it's ability to support multiple "projects". This allows you to setup a terminal environment based on configuration files. I use this to quickly establish a preset-layout of panes. The default location for project files is `~/.config/tmuxinator/`. Here is my `default.yml`:
```YAML
# /Users/jlcarveth/.tmuxinator/default.yml

name: default
root: .
project_root: .
windows:
  - editor:
      layout: 682c,210x54,0,0[210x36,0,0,3,210x17,0,37{105x17,0,37,4,104x17,106,37,5}]
      panes:
        - nvim
        - clear && t2
        - clear && neofetch
```
Now, whenever I type `tmuxinator default`, three new tmux panes are all created on the current working directory. This has the added benefit of working nicely with `auto-session` that was setup previously. If a neovim session has existed in that directory before, your nvim buffers are restored exactly as you had them the previous time you worked on the project.

To get your own layout string, setup tmux with panes how you like it, then run `tmux list-windows`. The layout string can be extracted from the square brackets. The `panes` option specifies what command should be run in each pane once it is launched. 
