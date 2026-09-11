---
title: "Three Macs, one config"
description: "A work laptop, a personal laptop, and a Mac mini that never sleeps. How I stopped setting up the same tools three times and let Nix do it."
date: 2026-09-11
---

I have three Macs.

There is a work MacBook Pro that I don't fully own and can't fully trust with
my personal life. There is a personal MacBook Pro that goes where I go. And
there is a Mac mini on a shelf that never sleeps, runs build daemons and agent
VMs, and does most of the actual work while the laptops are closed.

For a long time, each of them was set up by hand. That meant each of them was
set up *differently*, in ways I only discovered at the worst moment: `jq`
missing on the mini during an incident, a git alias that existed on one laptop
and not the other, tmux keybindings that had drifted so far apart that my
fingers had learned two dialects. Every new machine was a half-day of
"what did I have installed again?"

In February I stopped and put all three under one Nix flake. This is what that
looks like, what it fixed, and what it didn't.

## The shape of the problem

The three machines have a lot in common and a little that's different.

**Same everywhere:** the shell, git config, tmux, `vim`, `fzf`, `delta`, `jq`,
`gh`, Node, direnv, and the AI coding agents I actually use day to day. If I
sit down at any of the three, I want my hands to work.

**Different per machine:** the username, the home directory, and which
services run. The mini runs Tailscale, a secret-injecting proxy for VMs, an
iOS build queue, and a couple of long-lived orchestration daemons. The laptops
run none of that. The work machine has a different login than the personal
one.

Most dotfile setups handle the first half well and the second half badly. You
end up with `if [[ $(hostname) == ... ]]` sprinkled through your shell rc, and
a "services" folder of launchd plists you copy around by hand.

## What I did

One repo, one `flake.nix`, four nix-darwin hosts. The list is embarrassingly
short:

```nix
darwinHosts = [
  "MacBook-Pro-4"
  "m5prombp"
  "minis-Mac-mini"
  "minis-Mac-mini.system"
];
```

The hostnames are whatever `scutil --get LocalHostName` returns. Each maps to
a username, and that's the only per-host input. Everything else is shared
modules:

- A **system module** with the packages every Mac gets, plus the GUI apps I
  want managed rather than dragged from a DMG: the editor, the launcher, the
  browser, the display tool, the keyboard configurator.
- A **home-manager module** with git, tmux, bash, and zsh config, parameterised
  by username and home directory. It's the same file on all three machines.
- **Service modules** that only the mini enables: the build daemon, the VM
  secret proxy, the tunnel that discovers running VMs, the orchestration
  daemons. On the laptops those modules aren't imported, so they simply don't
  exist.

The bootstrap for a fresh Mac is now six steps, and five of them are "install
Nix and turn on flakes." The sixth is:

```sh
darwin-rebuild switch --flake ~/code/nix-config#$(scutil --get LocalHostName)
```

If the hostname isn't in the list, add it, commit, and run the same line. That
is the entire onboarding document.

## The part I didn't expect

Once the three Macs shared a flake, the flake started reaching past them.

The mini runs Linux VMs for coding agents. Those VMs want the same CLI tools I
have on the host. So there's a `homeConfigurations` entry for a Linux user
that imports the same home-manager module with `isDarwin = false` and a
trimmed package list, skipping the macOS-only bits. Same git config, same
tmux, same agents, inside the VM.

Then a Hetzner box came along for CI and deploys. It's NixOS, so it's the same
flake again, this time as a `nixosConfigurations` entry with its own disk
layout and a runner module. Secrets for all of it live in one encrypted
directory that each host can only partially decrypt, but that's a different
post.

The point is that "standardize three Macs" quietly became "one definition of
what a machine I work on looks like," and every new environment inherits it.

## What it fixed

- **Drift is gone.** If a tool exists, it exists everywhere, at the same
  version, because the lockfile says so.
- **Setup is a command.** A new laptop, a reinstalled mini, a fresh VM: same
  line, ten minutes, done.
- **Change is a commit.** When I tweak a tmux binding, it goes into git and
  arrives on the other machines on their next rebuild. I can see when I
  changed it and why.
- **The mini's services are code.** launchd plists, environment, restart
  policy, log paths. Not a folder of things I hope are still correct.

## What it didn't fix

Honesty section.

- **Nix on macOS is not painless.** The installer is fine. The first
  `darwin-rebuild` on a new machine is where you learn about experimental
  features, sudo, and `/run/current-system` not existing yet. My README has a
  paragraph for each of those because I hit each of them.
- **Not everything is packaged.** Some apps still come from the App Store or a
  vendor installer. I manage what I can and keep a short list of the rest.
- **Pinning has a cost.** A couple of daemons are pinned to specific versions
  of their inputs because a newer schema broke them. The flake carries
  comments explaining exactly what has to be migrated before bumping. That's
  the right kind of debt, but it's debt.
- **The work machine is still the work machine.** The config is shared, but I
  keep personal secrets and personal services off it on purpose. Nix makes
  that a module boundary rather than a habit, which is the most I can ask.

## If you have more than one Mac

You don't need the VMs, the build queue, or the Hetzner box. You need:

1. One flake with a list of hostnames.
2. A shared package list.
3. A shared home-manager module for your shell and git.
4. The discipline to change the repo instead of the machine.

The fourth one is the hard part, and Nix helps with it only in the sense that
changing the machine directly stops working after a while. That turned out to
be enough.
