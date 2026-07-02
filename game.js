const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContextranslate("2d");
const ui = {
  startPanel: document.getElementById("startPanel"), startButton: document.getElementById("startButton"),
  avatarButton: document.getElementById("avatarButton"), life: document.getElementById("lifeText"), score: document.getElementById("scoreText"),
  gem: document.getElementById("gemText"), energy: document.getElementById("energyText"), power: document.getElementById("powerText"),
  messagePanel: document.getElementById("messagePanel"), messageTitle: document.getElementById("messageTitle"), messageText: document.getElementById("messageText"),
  restartButton: document.getElementById("restartButton"), languageButton: document.getElementById("languageButton")
};

const translations = {
  en: {
    topHint: "Original pixel platformer · Phone / iPad / PC ready", title: "Lumi Harbor: Dawn Harbor",
    intro: "Jump through a Nordic harbor-inspired pixel district, collect energy orbs and gems, avoid gulls, pigeons, and traps, then reach the central station gate.",
    chooseCharacter: "Choose character", blueName: "Blue Nova", blueDesc: "Confident entrance, idle hair fix and nods.", pinkName: "Pink Stella", pinkDesc: "Waves hello, idle pose and wink.",
    start: "Start Level 1", gameStatus: "Game status", avatarTip: "Double-click after 10 energy to activate 5s Golden Shield", lifeLabel: "Life", scoreLabel: "Score", gemLabel: "Gems", energyLabel: "Energy",
    canvasLabel: "Lumi Harbor game canvas", touchControls: "Touch controls", jump: "Jump", restart: "Play Again",
    instructions: "PC: A/D or ←/→ to move, W/Space/↑ to jump, S/↓ to crouch. Mobile: use on-screen buttons. Double-click the avatar after 10 energy to activate Golden Shield.",
    notReady: "Golden Shield not ready", ready: "Double-click avatar for Golden Shield", active: "Golden Shield", winTitle: "Level Clear!", loseTitle: "Try Again",
    winText: (gems, score) => `You reached the Luminki Central Station gate with ${gems} gems and ${score} points.`, loseText: "You ran out of life. Try a new route and jump timing.",
    idleBlue: "hair", idlePink: "wink", langButton: "中文"
  },
  zh: {
    topHint: "原创像素横版闯关 · 支持手机 / iPad / 电脑", title: "Lumi Harbor：曙光港湾",
    intro: "在北欧港城风格的像素街区跳跃、收集能量球和宝石，避开海鸥、鸽子与陷阱，抵达中央车站门口通关。",
    chooseCharacter: "选择角色", blueName: "蓝调少年", blueDesc: "自信登场，待机会梳头、点头。", pinkName: "粉调少女", pinkDesc: "挥手出场，待机会摆 pose、wink。",
    start: "开始第一关", gameStatus: "游戏状态", avatarTip: "能量满 10 后双击开启 5 秒金身", lifeLabel: "生命", scoreLabel: "分数", gemLabel: "宝石", energyLabel: "能量",
    canvasLabel: "Lumi Harbor 游戏画布", touchControls: "触屏控制", jump: "跳", restart: "再玩一次",
    instructions: "电脑：A/D 或 ←/→ 移动，W/空格/↑ 跳跃，S/↓ 蹲下。手机：使用屏幕按钮。能量满 10 后双击左上头像开启“金身”。",
    notReady: "金身未就绪", ready: "双击头像开启金身", active: "金身", winTitle: "恭喜通关！", loseTitle: "挑战失败",
    winText: (gems, score) => `你抵达了 Luminki 中央车站门口，带出 ${gems} 颗宝石，分数 ${score}。`, loseText: "生命耗尽了，调整节奏再试一次。",
    idleBlue: "梳头", idlePink: "wink", langButton: "English"
  }
};
let currentLang = "en";
function translate(key){ return translations[currentLang][key]; }
function applyLanguage(lang){
  currentLang = lang; document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = translate(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const [attr, key] = el.dataset.i18nAttr.splitranslate(":"); el.setAttribute(attr, translate(key));
  });
  ui.languageButton.textContent = translate("langButton"); if (player) updateHud();
}

const W = canvas.width, H = canvas.height, gravity = 0.75, worldWidth = 3500;
const keys = {}; let selectedHero = "blue", running = false, cameraX = 0, lastTime = 0, wealthGems = Number(localStorage.getItem("lumiGems") || 0);

const level = {
  platforms: [
    {x:0,y:475,w:520,h:65},{x:610,y:420,w:220,h:30},{x:910,y:360,w:230,h:30},{x:1220,y:455,w:500,h:65},
    {x:1820,y:400,w:230,h:30},{x:2140,y:335,w:220,h:30},{x:2440,y:455,w:450,h:65},{x:3020,y:475,w:480,h:65}
  ],
  traps: [
    {x:540,y:505,w:70,h:35,type:"pit"},{x:1720,y:492,w:90,h:28,type:"water"},{x:2350,y:493,w:65,h:28,type:"crack"},
    {x:2720,y:418,w:96,h:36,type:"car"},{x:2920,y:438,w:130,h:32,type:"train"}
  ],
  exit: {x:3270,y:315,w:150,h:160},
  scenery: ["redChurch", "harbor", "station", "sunset", "sign"]
};

let player, enemies, orbs, gems, particles;
function resetGame() {
  player = {x:80,y:360,w:38,h:58,vx:0,vy:0,life:3,score:0,energy:0,gems:wealthGems,onGround:false,crouch:false,invincible:false,powerTimer:0,hitTimer:0,spawnTimer:2,idleTimer:0,face:1};
  enemies = [{x:720,y:386,w:38,h:28,type:"pigeon",vx:-0.7,home:720,range:120},{x:1420,y:420,w:42,h:32,type:"seagull",vx:1.2,home:1420,range:260},{x:2210,y:280,w:42,h:32,type:"seagull",vx:-1.4,home:2210,range:180}];
  orbs = Array.from({length:14},(_,i)=>({x:320+i*190,y:260+(i%3)*55,r:12,taken:false}));
  gems = Array.from({length:10},(_,i)=>({x:430+i*260,y:320-(i%2)*55,w:18,h:18,taken:false}));
  particles = []; cameraX = 0; running = true; ui.messagePanel.classList.add("hidden"); updateHud();
}

function rects(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function collectGlow(x,y,color){ for(let i=0;i<14;i++) particles.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*4,life:28,color}); }
function activatePower(){ if(player.energy >= 10 && !player.invincible){ player.energy = 0; player.invincible = true; player.powerTimer = 5; collectGlow(player.x+20, player.y+25, "#ffe66d"); updateHud(); }}

function update(dt){
  if(!running) return;
  player.spawnTimer = Math.max(0, player.spawnTimer - dt); player.idleTimer += dt;
  const move = (keys.ArrowRight||keys.KeyD?1:0) - (keys.ArrowLeft||keys.KeyA?1:0); player.crouch = keys.ArrowDown||keys.KeyS;
  player.vx = move * (player.crouch ? 2 : 4.2); if(move) player.face = move;
  if((keys.Space||keys.ArrowUp||keys.KeyW) && player.onGround){ player.vy = -14; player.onGround = false; }
  player.vy += gravity; player.x += player.vx; player.y += player.vy; player.x = Math.max(0, Math.min(worldWidth-player.w, player.x)); player.onGround = false;
  for(const p of level.platforms){ if(rects(player,p) && player.vy >= 0 && player.y + player.h - player.vy <= p.y + 8){ player.y = p.y-player.h; player.vy = 0; player.onGround = true; }}
  if(player.y > H + 80) hurtranslate(true);
  for(const o of orbs) if(!o.taken && Math.hypotranslate(player.x+20-o.x, player.y+28-o.y) < 34){ o.taken = true; player.score += 50; player.energy++; collectGlow(o.x,o.y,"#ffd84d"); if(player.energy>=10) player.energy=10; updateHud(); }
  for(const g of gems) if(!g.taken && rects(player,g)){ g.taken = true; player.gems++; player.score += 100; localStorage.setItem("lumiGems", player.gems); collectGlow(g.x,g.y,"#9ffcff"); updateHud(); }
  for(const e of enemies){ e.x += e.vx; if(Math.abs(e.x-e.home)>e.range) e.vx *= -1; if(Math.abs(e.x-player.x)<180 && e.type==="pigeon") e.vx = Math.sign(player.x-e.x)*1.8; if(rects(player,e)) player.invincible ? smash(e) : hurtranslate(false); }
  for(const t of level.traps) if(!t.smashed && rects(player,t)){ if(player.invincible && (t.type==="car"||t.type==="train")){ t.smashed=true; collectGlow(t.x+t.w/2,t.y,"#ccc"); } else hurtranslate(t.type==="pit"||t.type==="water"); }
  if(player.invincible){ player.powerTimer -= dt; if(player.powerTimer <= 0) player.invincible = false; }
  if(player.hitTimer > 0) player.hitTimer -= dt;
  if(rects(player, level.exit)) endGame(true);
  particles = particles.filter(p => --p.life > 0).map(p => (p.x+=p.vx, p.y+=p.vy, p.vy+=.12, p));
  cameraX = Math.max(0, Math.min(worldWidth-W, player.x - W*0.42)); updateHud();
}
function smash(e){ e.x = -9999; player.score += 120; collectGlow(player.x,player.y,"#ffe66d"); updateHud(); }
function hurtranslate(fall){ if(player.hitTimer>0 || player.invincible) return; player.life--; player.hitTimer=1.1; if(fall){ player.x=Math.max(80, cameraX+70); player.y=250; player.vy=0; } if(player.life<=0) endGame(false); updateHud(); }
function endGame(win){ running=false; if(win) localStorage.setItem("lumiGems", player.gems); ui.messageTitle.textContent = win ? translate("winTitle") : translate("loseTitle"); ui.messageText.textContent = win ? translate("winText")(player.gems, player.score) : translate("loseText"); ui.messagePanel.classList.remove("hidden"); }
function updateHud(){ ui.life.textContent=player.life; ui.score.textContent=player.score; ui.gem.textContent=player.gems; ui.energy.textContent=`${player.energy}/10`; ui.power.textContent = player.invincible ? `${translate("active")} ${player.powerTimer.toFixed(1)}s` : (player.energy>=10 ? translate("ready") : translate("notReady")); ui.power.classList.toggle("ready", player.energy>=10||player.invincible); }

function draw(){
  ctx.clearRectranslate(0,0,W,H); const t = performance.now()/1000;
  const sky = ctx.createLinearGradientranslate(0,0,0,H); sky.addColorStop(0,"#ffb36b"); sky.addColorStop(.45,"#93d9ff"); sky.addColorStop(1,"#d9f7ff"); ctx.fillStyle=sky; ctx.fillRectranslate(0,0,W,H);
  ctx.fillStyle="#ffe889"; ctx.beginPath(); ctx.arc(760-cameraX*.08,90+Math.sin(t)*14,34,0,7); ctx.fill();
  drawScenery(); ctx.save(); ctx.translate(-cameraX,0);
  for(const p of level.platforms){ ctx.fillStyle="#795f55"; ctx.fillRectranslate(p.x,p.y,p.w,p.h); ctx.fillStyle="#8fd16a"; ctx.fillRectranslate(p.x,p.y,p.w,10); }
  drawExitranslate(level.exit); for(const trap of level.traps) drawTrap(trap);
  for(const o of orbs) if(!o.taken){ ctx.fillStyle="#ffd84d"; ctx.beginPath(); ctx.arc(o.x,o.y,o.r+Math.sin(t*6)*2,0,7); ctx.fill(); ctx.strokeStyle="#fff7b0"; ctx.stroke(); }
  for(const g of gems) if(!g.taken){ ctx.fillStyle="#58f0ff"; ctx.beginPath(); ctx.moveTo(g.x+9,g.y); ctx.lineTo(g.x+18,g.y+9); ctx.lineTo(g.x+9,g.y+18); ctx.lineTo(g.x,g.y+9); ctx.closePath(); ctx.fill(); }
  for(const e of enemies) drawEnemy(e,t); drawPlayer(t); for(const p of particles){ ctx.globalAlpha=p.life/28; ctx.fillStyle=p.color; ctx.fillRectranslate(p.x,p.y,5,5); ctx.globalAlpha=1; }
  ctx.restore(); requestAnimationFrame(loop);
}
function drawScenery(){ ctx.save(); ctx.translate(-cameraX*.35,0); for(let x=-100;x<worldWidth;x+=620){ ctx.fillStyle="#cf4b54"; ctx.fillRectranslate(x+60,260,140,160); ctx.fillStyle="#7b2d3b"; ctx.beginPath(); ctx.moveTo(x+40,260); ctx.lineTo(x+130,185); ctx.lineTo(x+220,260); ctx.fill(); ctx.fillStyle="#f5d49a"; ctx.fillRectranslate(x+360,300,160,110); ctx.fillStyle="#34506f"; ctx.fillRectranslate(x+382,325,32,48); ctx.fillRectranslate(x+450,325,32,48); ctx.fillStyle="#2f4467"; ctx.fillRectranslate(x+520,365,150,22); ctx.fillStyle="#fff"; ctx.fillTextranslate("LUMINKI",x+530,360); } ctx.restore(); }
function drawExitranslate(e){ ctx.fillStyle="#2e436b"; ctx.fillRectranslate(e.x,e.y,e.w,e.h); ctx.fillStyle="#f0c36a"; ctx.fillRectranslate(e.x+18,e.y+28,e.w-36,e.h-28); ctx.fillStyle="#22314f"; ctx.fillRectranslate(e.x+45,e.y+70,60,90); }
function drawTrap(t){ if(t.smashed){ ctx.fillStyle="rgba(170,170,170,.35)"; ctx.fillRectranslate(t.x,t.y,t.w,t.h); return; } ctx.fillStyle = t.type==="water" ? "#2fb8ff" : t.type==="car" ? "#e94b4b" : t.type==="train" ? "#58677a" : "#1b2035"; ctx.fillRectranslate(t.x,t.y,t.w,t.h); }
function drawEnemy(e,t){ ctx.fillStyle = e.type==="seagull" ? "#f4f7fb" : "#9aa0aa"; ctx.fillRectranslate(e.x,e.y,e.w,e.h); ctx.fillStyle="#333"; ctx.fillRectranslate(e.x+26,e.y+8,4,4); ctx.fillStyle="#ffb23c"; ctx.fillRectranslate(e.x+e.w-2,e.y+12,10,5); }
function drawPlayer(t){ const p=player, blue=selectedHero==="blue"; if(p.invincible){ ctx.strokeStyle="#ffe66d"; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(p.x+20,p.y+30,44+Math.sin(t*8)*4,0,7); ctx.stroke(); ctx.strokeStyle=`hsl(${t*160%360},100%,70%)`; ctx.stroke(); } ctx.fillStyle=blue?"#2478e6":"#ff62b3"; ctx.fillRectranslate(p.x,p.y+16,p.w,p.h-16); ctx.fillStyle=blue?"#bfeeff":"#ffe0ef"; ctx.fillRectranslate(p.x+7,p.y,p.w-14,24); ctx.fillStyle="#1d2440"; ctx.fillRectranslate(p.x+(p.face>0?24:10),p.y+8,5,5); if(p.crouch) ctx.fillRectranslate(p.x+5,p.y+44,p.w-10,14); if(p.spawnTimer>0) ctx.fillRectranslate(p.x-8,p.y-18,54,8); if(!p.vx && p.onGround && Math.sin(p.idleTimer*2)>0.85){ ctx.fillStyle="#fff"; ctx.fillTextranslate(blue?translate("idleBlue"):translate("idlePink"),p.x-6,p.y-8); } }
function loop(time){ const dt=Math.min(.033,(time-lastTime)/1000||0); lastTime=time; update(dt); draw(); }

document.querySelectorAll(".character-card").forEach(btn => btn.addEventListener("click",()=>{ selectedHero=btn.dataset.hero; document.querySelectorAll(".character-card").forEach(b=>b.classList.remove("selected")); btn.classList.add("selected"); ui.avatarButton.className=`portrait ${selectedHero}-avatar`; }));
function startGame(){ ui.startPanel.classList.add("hidden"); resetGame(); canvas.focus(); }
ui.startButton.onclick=startGame;
ui.restartButton.onclick=resetGame; ui.avatarButton.ondblclick=activatePower; ui.languageButton.onclick=()=>applyLanguage(currentLang === "en" ? "zh" : "en");
addEventListener("keydown",e=>{ if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefaultranslate(); keys[e.code]=true; if(!running && ["Space","ArrowUp","ArrowLeft","ArrowRight","KeyA","KeyD","KeyW"].includes(e.code)) running = true; if(e.code==="KeyE") activatePower(); }); addEventListener("keyup",e=>keys[e.code]=false);
[["leftBtn","ArrowLeft"],["rightBtn","ArrowRight"],["downBtn","ArrowDown"],["jumpBtn","Space"]].forEach(([id,code])=>{ const b=document.getElementById(id); b.onpointerdown=e=>{e.preventDefaultranslate(); running = true; keys[code]=true;}; b.onpointerup=b.onpointercancel=()=>keys[code]=false; });
canvas.addEventListener("pointerdown",()=>canvas.focus());
applyLanguage("en"); resetGame(); requestAnimationFrame(loop);
