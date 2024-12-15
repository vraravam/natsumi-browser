<h1 align="center">
  <img width="120" height="120" src="https://github.com/greeeen-dev/natsumi-browser/blob/main/images/icon.png?raw=true">
  <br>
  Natsumi Browser
</h1>

<p align="center">A skin for Zen Browser that makes things <strong><i>~flow~</i></strong>.</p>

![](https://github.com/greeeen-dev/natsumi-browser/blob/main/images/natsumi-preview.png?raw=true)

## What is Natsumi Browser?
Natsumi Browser (or Natsumi, for short) is a userchrome made for [Zena
Browser](https://zen-browser.app) that adds lots of polish to the design by incorporating animations,
blurs and more. It's pretty much the userchrome I personally use, but made public.

Natsumi is NOT a standalone browser. I don't even intend on making one.

## Features
### Polished look
Natsumi Browser's looks are based on asev's [ZenCss](https://github.com/lunar-os/ZenCss), with some
additional tweaks and patches added on top to create a beautiful and polished experience.

![](https://github.com/greeeen-dev/natsumi-browser/blob/main/images/interface.gif?raw=true)

### Natsumi URLbar
With Natsumi URLbar, Natsumi gives the expanded URLbar a completely fresh new look, so it feels very
cozy while also having lots of room for search suggestions.

![](https://github.com/greeeen-dev/natsumi-browser/blob/main/images/natsumi-urlbar.gif?raw=true)

### Tab Groups
Natsumi Browser uses a customized version of [vicky5124](https://github.com/vicky5124)'s CSS for Tab
Groups. Group away to keep things organized!

![](https://github.com/greeeen-dev/natsumi-browser/blob/main/images/tab-groups.gif?raw=true)

## Installation
This skin is not available on the Zen Mods page, as this isn't intended to be a Mod. You will need to
install it by making the chrome.css file your userChrome.css file.

Read the [guide for live editing Zen Browser](https://docs.zen-browser.app/guides/live-editing) for more
details.

## Configs
- `natsumi.theme.disable-blur`: Disables blurring for Natsumi URLbar and Zen Sidebar. Use this if
  Zen Browser lags too much.
- `natsumi.theme.better-findbar-addon`: Enables some tweaks to
  [RobotoSkunk](https://github.com/RobotoSkunk)'s [Better Find
  Bar](https://zen-browser.app/mods/a6335949-4465-4b71-926c-4a52d34bc9c0/) Mod.
- `natsumi.urlbar.disabled`: Disables Natsumi URLbar and reverts the URLbar style back.
- `natsumi.urlbar.light`: Disables some animations to make Natsumi URLbar lighter.
- `natsumi.sidebar.blur-zen-sidebar`: Blurs Zen Sidebar background. This may cause some lag when you
  have both Zen Sidebar and Natsumi URLbar opened at the same time.
- `natsumi.sidebar.disable-panel-transparency`: Disables transparent background for sidebar panels
  (e.g. Bookmarks).
- `natsumi.debug.legacy`: Enables support for 1.0.2-b.0 and 1.0.2-b.1.

## Troubleshooting
### "URLbar blur won't work!"
Make sure both `layout.css.backdrop-filter.enabled` and `layout.css.backdrop-filter.force-enabled` are
set to true. Also make sure that you're using WebRender and hardware rendering.

### "Zen Browser lags a lot!"
This may be due to the URLbar blurring or animations (likely the blur). Set `natsumi.theme.disable-blur`
to false to disable the blur, and `natsumi.urlbar.light` to true to disable the animations.

### "I don't see any of those options in about:config!"
These are custom options which you need to create. Type in the exact name, then press the plus button on
the right to create the config.
