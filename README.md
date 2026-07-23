<p align="center">
  <img src="build/icon.png" width="96" height="96" alt="Lumen">
</p>

<h1 align="center">Lumen App</h1>

<p align="center">
  <a href="https://github.com/yaws-agent/lumenapp/releases"><img src="https://img.shields.io/badge/version-1.0.0-blue?style=flat-square" alt="version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license"></a>
  <a href="https://www.electronjs.org/"><img src="https://img.shields.io/badge/Electron-30-47848F?style=flat-square&logo=electron&logoColor=white" alt="electron"></a>
  <a href="https://github.com/yaws-agent/lumenapp/releases"><img src="https://img.shields.io/badge/platform-Linux%20(x86__64%20%2F%20arm64)-2ECF5F?style=flat-square&logo=linux&logoColor=white" alt="platform"></a>
</p>

<p align="center">
  A clean <b>Glass</b> interface for the <a href="https://github.com/swwayps/slsteam-moon">slsteam-moon</a> hook (the Linux spiritual successor to <b>Lua Tools</b>).
</p>

---

## ✨ Features

- **Glass UI** — frosted glass, iridescent cursor-tracking hover lens, raised active pills.
- **8 views** — Home, Plugin, Fixes, Manage, Manifests, Mode, Settings, About.
- **slsteam-moon backend** — install/uninstall the hook, toggle fixes (parental restrictions, family-share lock, unowned games), manage Cloud saves, install manifests, switch update channels.
- **Distro-agnostic AppImage** — one executable, no install, no `chmod` needed.
- **Auto-update** — delta updates from GitHub Releases (supports **Stable** / **Beta** channels).

## 📦 Installation

Download the latest `Lumen-*.AppImage` from **[Releases](https://github.com/yaws-agent/lumenapp/releases)**, make it executable if needed, and run:

```bash
chmod +x Lumen-*.AppImage   # only if your DE doesn't do it automatically
./Lumen-*.AppImage
```

> Requires an installed Steam client. The app manages the `slsteam-moon` hook on top of it.

## 🛠️ Build from source

```bash
git clone https://github.com/yaws-agent/lumenapp.git
cd lumenapp
npm install
npm start            # run in dev
npm run dist         # build AppImage (x64 + arm64)
npm run release      # build + publish to GitHub Releases (needs GH_TOKEN)
```

## 🧱 Tech stack

- **Electron 30** (main process + preload bridge)
- **electron-builder** — AppImage packaging + publish
- **electron-updater** — auto-update from GitHub Releases
- Vanilla JS/CSS renderer — no framework, pure Liquid Glass styling

## 🔄 Auto-update

On launch Lumen silently checks GitHub Releases. Updates download in the background (delta / blockmap) and install on quit. Switch to the **Beta** channel from *Settings → Mode* to receive experimental builds earlier. Use *About → Check for Updates* for a manual check.

## 🙏 Credits

- **[madoiscool/LuaTools](https://github.com/madoiscool/LuaTools)** — This project was highly inspired by the Lua Tools App for Windows. All credit goes to him and the entire Lua Tools team.
- **[swwayps/luatools-moon](https://github.com/swwayps/luatools-moon)** / **[swwayps/slsteam-moon](https://github.com/swwayps/slsteam-moon)** — the backend this app drives.

## 📄 License

[MIT](LICENSE) © Hermes
