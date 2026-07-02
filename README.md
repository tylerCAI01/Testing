# Lumi Harbor: Dawn Harbor / 曙光港湾

An original browser platformer prototype with English as the default language and a one-click Chinese toggle. It is inspired by classic side-scrolling jump games, but it does not use any Mario, Nintendo characters, music, or assets. The project only uses HTML, CSS, and JavaScript, so it can be deployed to GitHub Pages and opened from WeChat links on phones, iPads, and computers.

一个原创横版闯关网页小游戏原型，默认英文界面，并支持一键切换中文。玩法参考经典平台跳跃类型，但不使用任何马里奥、任天堂角色、音乐或素材。项目只使用 HTML、CSS、JavaScript，适合部署到 GitHub Pages，也适合通过微信链接在手机、iPad 和电脑浏览器中打开。

## Features / 游戏内容

- English UI is shown by default; the top-right language button switches between English and Chinese.
- Players can choose between two original cartoon heroes: Blue Nova or Pink Stella.
- Level 1 uses an original Nordic harbor-inspired pixel district with sunrise/sunset colors, red church-like rooftops, harbor/station scenery, and a fictional `LUMINKI` sign.
- The hero can move left/right, jump, crouch, and show small idle animations such as hair fixing or wink text.
- Golden energy orbs increase the energy meter; after collecting 10 energy, double-click the avatar or press `E` to activate a 5-second Golden Shield.
- Golden Shield adds a gold/rainbow aura and can smash heavy train/car traps.
- Blue gems increase wealth and are persisted with `localStorage`.
- Enemies include pigeons and gulls; traps include pits, cracks, water, cars, and trains.
- Reaching the station gate clears the level; losing all life ends the run.

## Controls / 操作方式

### PC / 电脑

- `A / D` or `← / →`: move
- `W`, `Space`, or `↑`: jump
- `S` or `↓`: crouch
- After 10 energy: double-click the top-left avatar, or press `E`, to activate Golden Shield

### Phone / iPad / 手机和平板

- Use the on-screen buttons for left, right, crouch, and jump.
- After 10 energy, double-click the top-left avatar to activate Golden Shield.

## Files / 文件结构

```text
index.html   # Page structure, bilingual UI hooks, start panel, HUD, touch controls
style.css    # Responsive layout, pixel-style visuals, language button, mobile controls
game.js      # Canvas loop, language dictionary, movement, gravity, collision, enemies, traps
README.md    # Project instructions
```

## Run locally / 本地运行

Open `index.html` directly in a browser, or start a static server from this folder:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Deploy to GitHub Pages / 部署到 GitHub Pages

1. Push this project to GitHub.
2. Open **Settings → Pages** in the repository.
3. Select the `main` branch and root folder `/`.
4. Save and wait for GitHub Pages to publish the site.
5. Share the generated URL in WeChat; players can open it on mobile, iPad, or desktop browsers.

## Future ideas / 后续扩展建议

- Add more level data, weather, and day/night variants.
- Give gems a shop or character-skin use.
- Add richer patrol/chase logic for gulls and pigeons.
- Add original sound effects and music.
- Move level objects into JSON for easier editing.
