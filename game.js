const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const ui = {
  startPanel: document.getElementById("startPanel"), startButton: document.getElementById("startButton"),
  avatarButton: document.getElementById("avatarButton"), life: document.getElementById("lifeText"), score: document.getElementById("scoreText"),
  gem: document.getElementById("gemText"), energy: document.getElementById("energyText"), power: document.getElementById("powerText"),
  messagePanel: document.getElementById("messagePanel"), messageTitle: document.getElementById("messageTitle"), messageText: document.getElementById("messageText"),
  restartButton: document.getElementById("restartButton"), languageButton: document.getElementById("languageButton"),
  sensitivityRange: document.getElementById("sensitivityRange"), sensitivityValue: document.getElementById("sensitivityValue")
};

const translations = {
  en: {
    topHint: "Original pixel platformer · Phone / iPad / PC ready", title: "Lumi Harbor: Dawn Harbor",
    intro: "Jump through a Nordic harbor-inspired pixel district, collect energy orbs and gems, avoid gulls, pigeons, and traps, then reach the central station gate.",
    chooseCharacter: "Choose character", blueName: "Blue Nova", blueDesc: "Confident entrance, idle hair fix and nods.", pinkName: "Pink Stella", pinkDesc: "Waves hello, idle pose and wink.",
    start: "Start Level 1", gameStatus: "Game status", avatarTip: "Double-click after 5 energy or press E to activate 5s Golden Shield", lifeLabel: "Life", scoreLabel: "Score", gemLabel: "Gems", energyLabel: "Energy",
    canvasLabel: "Lumi Harbor game canvas", touchControls: "Touch controls", jump: "Jump", restart: "Play Again",
    instructions: "PC: A/D or ←/→ to move, W/Space/↑ to double-jump, S/↓ to slide, E for Golden Shield after 5 energy. Mobile: use buttons and double-tap the avatar.",
    notReady: "Golden Shield not ready", ready: "Double-click avatar or press E for Golden Shield", active: "Golden Shield", winTitle: "Level Clear!", loseTitle: "Try Again",
    winText: (gems, score) => `You reached the Luminki Central Station gate with ${gems} gems and ${score} points.`, loseText: "You ran out of life. Try a new route and jump timing.",
    idleBlue: "hair", idlePink: "wink", langButton: "中文", sensitivityLabel: "Control sensitivity"
  },
  zh: {
    topHint: "原创像素横版闯关 · 支持手机 / iPad / 电脑", title: "Lumi Harbor：曙光港湾",
    intro: "在北欧港城风格的像素街区跳跃、收集能量球和宝石，避开海鸥、鸽子与陷阱，抵达中央车站门口通关。",
    chooseCharacter: "选择角色", blueName: "蓝调少年", blueDesc: "自信登场，待机会梳头、点头。", pinkName: "粉调少女", pinkDesc: "挥手出场，待机会摆 pose、wink。",
    start: "开始第一关", gameStatus: "游戏状态", avatarTip: "能量满 5 后双击头像或按 E 开启 5 秒金身", lifeLabel: "生命", scoreLabel: "分数", gemLabel: "宝石", energyLabel: "能量",
    canvasLabel: "Lumi Harbor 游戏画布", touchControls: "触屏控制", jump: "跳", restart: "再玩一次",
    instructions: "电脑：A/D 或 ←/→ 移动，W/空格/↑ 二段跳，S/↓ 滑铲，E 在能量满 5 后秒开金身。手机：用屏幕按钮，双击头像开金身。",
    notReady: "金身未就绪", ready: "双击头像或按 E 开启金身", active: "金身", winTitle: "恭喜通关！", loseTitle: "挑战失败",
    winText: (gems, score) => `你抵达了 Luminki 中央车站门口，带出 ${gems} 颗宝石，分数 ${score}。`, loseText: "生命耗尽了，调整节奏再试一次。",
    idleBlue: "梳头", idlePink: "wink", langButton: "English", sensitivityLabel: "操作灵敏度"
  }
};
let currentLang = "en";
function translate(key){ return translations[currentLang][key]; }
function applyLanguage(lang){
  currentLang = lang; document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = translate(el.dataset.i18n));
  document.querySelectorAll("[data-i18n-attr]").forEach(el => {
    const [attr, key] = el.dataset.i18nAttr.split(":"); el.setAttribute(attr, translate(key));
  });
  ui.languageButton.textContent = translate("langButton"); if (player) updateHud();
}

const W = canvas.width, H = canvas.height, gravity = 0.62, worldWidth = 3500, energyGoal = 5;
const keys = {}; let selectedHero = "blue", running = false, cameraX = 0, lastTime = 0, sensitivity = 0.75, wealthGems = Number(localStorage.getItem("lumiGems") || 0);

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
  player = {x:80,y:340,w:42,h:84,vx:0,vy:0,life:3,score:0,energy:0,gems:wealthGems,onGround:false,crouch:false,sliding:false,slideTimer:0,invincible:false,powerTimer:0,hitTimer:0,spawnTimer:2,idleTimer:0,face:1,jumpsUsed:0,jumpLatch:false,spinTimer:0,landTimer:0};
  const pigeonColors = ["#77707f", "#8f8895", "#6f7588", "#9a9290"];
  enemies = [
    {x:760,y:386,w:42,h:34,type:"pigeon",vx:0,home:760,range:120,hp:1,mode:null,deadTimer:0,color:pigeonColors[Math.floor(Math.random()*pigeonColors.length)],eat:0},
    {x:1330,y:421,w:42,h:34,type:"pigeon",vx:0,home:1330,range:120,hp:1,mode:null,deadTimer:0,color:pigeonColors[Math.floor(Math.random()*pigeonColors.length)],eat:1},
  ];
  orbs = Array.from({length:5},(_,i)=>({x:360+i*360,y:255+(i%3)*55,r:12,taken:false}));
  gems = Array.from({length:10},(_,i)=>({x:430+i*260,y:320-(i%2)*55,w:18,h:18,taken:false}));
  particles = []; cameraX = 0; running = true; ui.messagePanel.classList.add("hidden"); updateHud();
}

function rects(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function collectGlow(x,y,color){ for(let i=0;i<14;i++) particles.push({x,y,vx:(Math.random()-.5)*4,vy:-Math.random()*4,life:28,color}); }
function activatePower(){ if(player.energy >= energyGoal && !player.invincible){ player.energy = 0; player.invincible = true; player.powerTimer = 5; collectGlow(player.x+20, player.y+25, "#ffe66d"); updateHud(); }}

function update(dt){
  if(!running) return;
  player.spawnTimer = Math.max(0, player.spawnTimer - dt); player.idleTimer += dt;
  const move = (keys.ArrowRight||keys.KeyD?1:0) - (keys.ArrowLeft||keys.KeyA?1:0);
  const crouchKey = keys.ArrowDown||keys.KeyS;
  const jumpKey = keys.Space||keys.ArrowUp||keys.KeyW;
  const conflict = crouchKey && jumpKey;
  player.crouch = !conflict && crouchKey && player.onGround;
  player.sliding = player.crouch && Math.abs(player.vx) > 0.65 && move !== 0;
  if(player.sliding) player.slideTimer = 0.28;
  else player.slideTimer = Math.max(0, player.slideTimer - dt);
  const maxSpeed = player.crouch ? (player.sliding ? 3.55 : 1.05) * sensitivity : 3.15 * sensitivity;
  player.vx += (move * maxSpeed - player.vx) * (player.sliding ? 0.12 : 0.22);
  if(Math.abs(player.vx) < 0.04) player.vx = 0;
  if(move) player.face = move;
  if(!jumpKey) player.jumpLatch = false;
  if(!conflict && jumpKey && !player.jumpLatch && player.jumpsUsed < 2){
    player.jumpLatch = true;
    if(player.onGround){ player.vy = -10.25; player.onGround = false; player.jumpsUsed = 1; }
    else { player.vy = -15.2; player.jumpsUsed = 2; player.spinTimer = 0.55; }
  }
  if(player.spinTimer > 0) player.spinTimer -= dt;
  if(player.landTimer > 0) player.landTimer -= dt;
  player.vy += gravity; player.x += player.vx; player.y += player.vy; player.x = Math.max(0, Math.min(worldWidth-player.w, player.x)); player.onGround = false;
  for(const p of level.platforms){ if(rects(player,p) && player.vy >= 0 && player.y + player.h - player.vy <= p.y + 8){ player.y = p.y-player.h; player.vy = 0; if(!player.onGround && player.jumpsUsed > 0){ player.landTimer = 0.22; } player.onGround = true; player.jumpsUsed = 0; }}
  if(player.y > H + 80) hurt(true);
  for(const o of orbs) if(!o.taken && Math.hypot(player.x+20-o.x, player.y+28-o.y) < 34){ o.taken = true; player.score += 50; player.energy++; collectGlow(o.x,o.y,"#ffd84d"); if(player.energy>=energyGoal) player.energy=energyGoal; updateHud(); }
  for(const g of gems) if(!g.taken && rects(player,g)){ g.taken = true; player.gems++; player.score += 100; localStorage.setItem("lumiGems", player.gems); collectGlow(g.x,g.y,"#9ffcff"); updateHud(); }
  for(const e of enemies){
    if(e.deadTimer > 0){ e.deadTimer -= dt; continue; }
    if(e.hp <= 0) continue;
    if(e.type === "seagull"){
      e.x += e.vx;
      if(e.x + e.w < 0) e.hp = 0;
    } else if(e.type === "pigeon"){
      e.eat += dt;
      if(!e.mode) e.mode = "walk";
      if(e.x + e.w < cameraX - 40){ e.hp = 0; continue; }
      if(Math.abs(e.x-player.x) < 210){ e.vx = Math.sign(player.x-e.x || -1) * 0.55; } else e.vx = -0.35;
      if(e.mode === "walk") e.x += e.vx;
      if(e.mode === "fly"){ e.x += e.vx; e.y += Math.sin(performance.now()/170 + e.x*.02) * 0.45; }
    }
    if(rects(player,e)){
      if(player.invincible || player.sliding || player.slideTimer > 0) defeatEnemy(e);
      else hurt(false);
    }
  }
  for(const t of level.traps) if(!t.smashed && rects(player,t)){ if(player.invincible && (t.type==="car"||t.type==="train")){ t.smashed=true; collectGlow(t.x+t.w/2,t.y,"#ccc"); } else hurt(t.type==="pit"||t.type==="water"); }
  if(player.invincible){ player.powerTimer -= dt; if(player.powerTimer <= 0) player.invincible = false; }
  if(player.hitTimer > 0) player.hitTimer -= dt;
  if(rects(player, level.exit)) endGame(true);
  particles = particles.filter(p => --p.life > 0).map(p => (p.x+=p.vx, p.y+=p.vy, p.vy+=.12, p));
  cameraX = Math.max(0, Math.min(worldWidth-W, player.x - W*0.42)); updateHud();
}
function smash(e){ defeatEnemy(e); }
function defeatEnemy(e){ if(e.hp <= 0) return; e.hp = 0; e.deadTimer = 1.15; player.score += e.type === "pigeon" ? 160 : 120; collectGlow(e.x+e.w/2,e.y+e.h/2,e.type === "pigeon" ? "#f2f2f2" : "#ffe66d"); updateHud(); }
function hurt(fall){ if(player.hitTimer>0 || player.invincible) return; player.life--; player.hitTimer=1.1; if(fall){ player.x=Math.max(80, cameraX+70); player.y=250; player.vy=0; } if(player.life<=0) endGame(false); updateHud(); }
function endGame(win){ running=false; if(win) localStorage.setItem("lumiGems", player.gems); ui.messageTitle.textContent = win ? translate("winTitle") : translate("loseTitle"); ui.messageText.textContent = win ? translate("winText")(player.gems, player.score) : translate("loseText"); ui.messagePanel.classList.remove("hidden"); }
function updateHud(){ ui.life.textContent=player.life; ui.score.textContent=player.score; ui.gem.textContent=player.gems; ui.energy.textContent=`${player.energy}/${energyGoal}`; ui.power.textContent = player.invincible ? `${translate("active")} ${player.powerTimer.toFixed(1)}s` : (player.energy>=energyGoal ? translate("ready") : translate("notReady")); ui.power.classList.toggle("ready", player.energy>=energyGoal||player.invincible); }

function draw(){
  ctx.clearRect(0,0,W,H); const t = performance.now()/1000;
  const sky = ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,"#ffb36b"); sky.addColorStop(.45,"#93d9ff"); sky.addColorStop(1,"#d9f7ff"); ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#ffe889"; ctx.beginPath(); ctx.arc(760-cameraX*.08,90+Math.sin(t)*14,34,0,7); ctx.fill();
  drawScenery(); ctx.save(); ctx.translate(-cameraX,0);
  for(const p of level.platforms) drawPlatform(p,t);
  drawExit(level.exit); for(const trap of level.traps) drawTrap(trap);
  for(const o of orbs) if(!o.taken){ ctx.fillStyle="#ffd84d"; ctx.beginPath(); ctx.arc(o.x,o.y,o.r+Math.sin(t*6)*2,0,7); ctx.fill(); ctx.strokeStyle="#fff7b0"; ctx.stroke(); }
  for(const g of gems) if(!g.taken){ ctx.fillStyle="#58f0ff"; ctx.beginPath(); ctx.moveTo(g.x+9,g.y); ctx.lineTo(g.x+18,g.y+9); ctx.lineTo(g.x+9,g.y+18); ctx.lineTo(g.x,g.y+9); ctx.closePath(); ctx.fill(); }
  for(const e of enemies) drawEnemy(e,t); drawPlayer(t); for(const p of particles){ ctx.globalAlpha=p.life/28; ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,5,5); ctx.globalAlpha=1; }
  ctx.restore();
}
function drawPlatform(p,t){
  ctx.fillStyle="#6f544b"; ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.fillStyle="#8fd16a"; ctx.fillRect(p.x,p.y,p.w,12);
  ctx.fillStyle="#5e9f4d";
  for(let gx=p.x+7; gx<p.x+p.w-4; gx+=18){
    const sway = Math.sin(t*2 + gx*.05)*2;
    ctx.fillRect(gx,p.y+3,3,8); ctx.fillRect(gx+4+sway,p.y+1,3,10); ctx.fillRect(gx+9,p.y+5,3,6);
  }
  ctx.fillStyle="#a27a61";
  for(let sx=p.x+8; sx<p.x+p.w; sx+=42) ctx.fillRect(sx,p.y+22,26,4);
  ctx.fillStyle="#4c3b35"; ctx.fillRect(p.x,p.y+p.h-8,p.w,8);
}
function drawScenery(){
  ctx.save(); ctx.translate(-cameraX*.35,0);
  for(let x=-160;x<worldWidth;x+=620){
    ctx.fillStyle="rgba(255,245,210,.35)"; ctx.fillRect(x+18,300,720,132);
    ctx.fillStyle="#c84b4f"; ctx.fillRect(x+60,250,148,170);
    ctx.fillStyle="#9f3945";
    for(let by=260; by<410; by+=18) for(let bx=x+68+(by%36?0:9); bx<x+198; bx+=28) ctx.fillRect(bx,by,18,4);
    ctx.fillStyle="#7b2d3b"; ctx.beginPath(); ctx.moveTo(x+38,250); ctx.lineTo(x+132,174); ctx.lineTo(x+226,250); ctx.fill();
    ctx.fillStyle="#5f2636"; for(let rx=x+62; rx<x+196; rx+=26) ctx.fillRect(rx,240,18,5);
    ctx.fillStyle="#ffe2a8"; ctx.fillRect(x+116,302,34,58); ctx.fillStyle="#3d5f7c"; ctx.fillRect(x+123,314,20,36);
    const houses=[['#f2d29b',265,126],['#d9e4ef',284,104],['#e9b08c',276,118],['#f6dfb8',292,96]];
    houses.forEach((h,i)=>{ const hx=x+250+i*108, hy=h[1], hh=h[2]; ctx.fillStyle=h[0]; ctx.fillRect(hx,hy,96,hh); ctx.fillStyle=i%2?'#46627f':'#344b67'; ctx.fillRect(hx-4,hy-12,104,14); ctx.fillStyle='#33516e'; for(let wy=hy+22; wy<hy+hh-18; wy+=30) for(let wx=hx+16; wx<hx+78; wx+=28) ctx.fillRect(wx,wy,14,18); ctx.fillStyle='rgba(255,255,255,.45)'; ctx.fillRect(hx+10,hy+hh-26,76,4); });
    ctx.fillStyle="#2f4467"; ctx.fillRect(x+700,338,180,74); ctx.fillStyle="#d6b46b"; ctx.fillRect(x+710,320,160,22); ctx.fillStyle="#fff"; ctx.fillText("LUMINKI",x+728,336);
    ctx.fillStyle="#303a4b"; ctx.fillRect(x+720,374,140,28); ctx.fillStyle="#8fb6c9"; for(let tx=x+730; tx<x+850; tx+=30) ctx.fillRect(tx,380,18,12);
  }
  ctx.restore();
}
function drawExit(e){
  ctx.fillStyle="#263a61"; ctx.fillRect(e.x,e.y,e.w,e.h);
  ctx.fillStyle="#d8b45f"; ctx.fillRect(e.x+12,e.y+18,e.w-24,24);
  ctx.fillStyle="#f0c36a"; ctx.fillRect(e.x+18,e.y+42,e.w-36,e.h-42);
  ctx.fillStyle="#22314f"; ctx.fillRect(e.x+45,e.y+82,60,78);
  ctx.fillStyle="#355a7b"; ctx.fillRect(e.x+30,e.y+54,22,24); ctx.fillRect(e.x+98,e.y+54,22,24);
  ctx.fillStyle="#ffffff"; ctx.fillText("CENTRAL",e.x+38,e.y+34);
}
function drawTrap(t){ if(t.smashed){ ctx.fillStyle="rgba(170,170,170,.35)"; ctx.fillRect(t.x,t.y,t.w,t.h); return; } ctx.fillStyle = t.type==="water" ? "#2fb8ff" : t.type==="car" ? "#e94b4b" : t.type==="train" ? "#58677a" : "#1b2035"; ctx.fillRect(t.x,t.y,t.w,t.h); }
function drawEnemy(e,t){
  if(e.hp <= 0){ drawEnemyDefeat(e,t); return; }
  if(e.type === "pigeon") return drawPigeon(e,t);
  ctx.fillStyle = "#f4f7fb"; ctx.fillRect(e.x,e.y,e.w,e.h); ctx.fillStyle="#333"; ctx.fillRect(e.x+26,e.y+8,4,4); ctx.fillStyle="#ffb23c"; ctx.fillRect(e.x+e.w-2,e.y+12,10,5);
}
function drawPigeon(e,t){
  const eat = !e.mode && Math.sin(e.eat*8) > 0, fly = e.mode === "fly";
  const x=e.x, y=e.y + (fly ? Math.sin(t*8)*2 : 0), c=e.color || "#837b8a";
  ctx.fillStyle="#282431"; ctx.fillRect(x+5,y+4,20,18); ctx.fillRect(x+21,y+10,18,14);
  ctx.fillStyle=c; ctx.fillRect(x+8,y+7,18,18); ctx.fillRect(x+22,y+13,17,13);
  ctx.fillStyle="#b9b7c0"; ctx.fillRect(x+10,y+22,18,7); ctx.fillRect(x+25,y+24,10,4);
  ctx.fillStyle="#11a58f"; ctx.fillRect(x+17,y+18,8,5); ctx.fillStyle="#9a4aa3"; ctx.fillRect(x+14,y+22,9,5);
  ctx.fillStyle="#f5b22d"; ctx.fillRect(x, y+14,10,5); ctx.fillStyle="#111"; ctx.fillRect(x+13,y+10,4,4);
  if(eat){ ctx.fillStyle="#7e4d3f"; ctx.fillRect(x-4,y+31,4,4); ctx.fillRect(x+6,y+34,4,4); }
  if(fly){ ctx.fillStyle=c; ctx.fillRect(x+3,y+24,18,10); ctx.fillRect(x+27,y+4,12,16); }
  ctx.fillStyle="#b45668"; ctx.fillRect(x+13,y+29,5,11); ctx.fillRect(x+27,y+29,5,11);
}
function drawEnemyDefeat(e,t){
  if(e.deadTimer <= 0) return;
  const flash = Math.floor(e.deadTimer*28)%2===0;
  ctx.globalAlpha = Math.min(1, e.deadTimer*1.2);
  ctx.fillStyle = flash ? "#ff4545" : "#ffffff"; ctx.fillRect(e.x,e.y,e.w,e.h);
  ctx.fillStyle="rgba(220,220,220,.65)"; ctx.fillRect(e.x+14,e.y+10,18,14); ctx.fillRect(e.x+22,e.y+4,10,9); ctx.fillRect(e.x+7,e.y+18,10,8);
  ctx.fillStyle="#f2f2f2"; ctx.fillRect(e.x+3,e.y-14+(1.15-e.deadTimer)*-28,10,6); ctx.fillRect(e.x+28,e.y-10+(1.15-e.deadTimer)*-32,12,6); ctx.fillRect(e.x+18,e.y-5+(1.15-e.deadTimer)*-25,9,6);
  ctx.globalAlpha = 1;
}
function drawPlayer(t){
  const p=player, blue=selectedHero==="blue", x=p.x, y=p.y, dir=p.face, crouch=p.crouch, slide=p.sliding || p.slideTimer>0;
  const doubleSpin = p.spinTimer > 0 && !p.onGround, heroIdle = !p.vx && p.onGround && !crouch && p.idleTimer > 3;
  const landing = p.landTimer > 0;
  const bodyY = y + (slide ? 24 : landing ? 16 : crouch ? 13 : 0), legY = y + (slide ? 70 : landing ? 67 : crouch ? 66 : 62);
  if(p.invincible){ ctx.strokeStyle="#ffe66d"; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(x+21,y+41,46+Math.sin(t*8)*4,0,7); ctx.stroke(); ctx.strokeStyle=`hsl(${t*160%360},100%,70%)`; ctx.stroke(); }
  ctx.save(); if(dir < 0){ ctx.translate(x+p.w,0); ctx.scale(-1,1); } else ctx.translate(x,0);
  if(doubleSpin){
    ctx.translate(21,42); ctx.rotate(t*14); ctx.fillStyle=blue?"#2d72d8":"#ff6fb8"; ctx.fillRect(-22,-22,44,44);
    ctx.fillStyle=blue?"#050712":"#f0c84b"; ctx.fillRect(-18,-27,36,12); ctx.fillStyle=blue?"#f2cda8":"#ffd9b1"; ctx.fillRect(-11,-18,22,18);
    ctx.fillStyle="#fff"; ctx.fillRect(-25,-5,10,7); ctx.fillRect(15,-5,10,7); ctx.restore(); return;
  }
  if(blue){
    const idlePhase = heroIdle ? Math.floor((p.idleTimer % 4) / 1.35) : -1;
    const hatLift = idlePhase === 0 ? -13 : 0;
    ctx.fillStyle="#050712"; ctx.fillRect(10,bodyY+4,24,13); ctx.fillRect(14,bodyY+15,17,9);
    ctx.fillStyle="#8d1d28"; ctx.fillRect(10,bodyY-7+hatLift,24,10); ctx.fillRect(5,bodyY+hatLift,34,10);
    ctx.fillStyle="#dff1e6"; ctx.fillRect(14,bodyY+7,28,8);
    ctx.fillStyle="#f2cda8"; ctx.fillRect(8,bodyY+10,27,26);
    ctx.fillStyle="#15264d"; ctx.fillRect(5,bodyY+14,10,8); ctx.fillRect(26,bodyY+14,14,8); ctx.fillRect(8,bodyY+36,28,8);
    ctx.fillStyle="#050712"; ctx.fillRect(20,bodyY+22,6,10); ctx.fillRect(32,bodyY+23,5,11); ctx.fillRect(17,bodyY+40,22,24);
    ctx.fillStyle="#2d72d8"; ctx.fillRect(0,bodyY+36,12,24); ctx.fillRect(31,bodyY+36,11,23); ctx.fillStyle="#78ad5c"; ctx.fillRect(3,bodyY+31,8,28);
    ctx.fillStyle="#f2cda8";
    if(slide){ ctx.fillRect(7,bodyY+58,10,7); ctx.fillRect(35,bodyY+45,8,16); }
    else if(landing){ ctx.fillRect(0,bodyY+48,9,17); ctx.fillRect(34,bodyY+48,9,17); }
    else if(heroIdle && idlePhase === 0){ ctx.fillRect(33,bodyY-4,7,22); ctx.fillRect(38,bodyY-8,10,8); ctx.fillRect(-1,bodyY+43,8,12); }
    else if(heroIdle && idlePhase === 1){ ctx.fillRect(-4,bodyY+34,7,22); ctx.fillRect(39,bodyY+34,7,22); }
    else { ctx.fillRect(-4,bodyY+56,7,10); ctx.fillRect(42,bodyY+47,8,7); }
    ctx.fillStyle="#11131c";
    if(slide){ ctx.fillRect(2,legY,38,8); ctx.fillRect(23,legY-13,18,8); }
    else if(landing){ ctx.fillRect(7,legY-6,17,8); ctx.fillRect(25,legY-6,17,8); }
    else if(crouch){ ctx.fillRect(8,legY-8,16,8); ctx.fillRect(24,legY-3,17,8); }
    else { ctx.fillRect(11,legY,12,18); ctx.fillRect(24,legY,12,18); }
    ctx.fillStyle="#a9272e"; ctx.fillRect(10,legY+(slide?7:crouch?4:16),13,5); ctx.fillRect(26,legY+(slide?-4:crouch?9:16),13,5);
  } else {
    const wink = heroIdle && Math.sin(p.idleTimer*3) > 0.25;
    ctx.fillStyle="#f6d65e"; ctx.fillRect(6,bodyY-5,30,11); ctx.fillRect(2,bodyY+6,38,28); ctx.fillRect(0,bodyY+18,10,18); ctx.fillRect(32,bodyY+17,10,20);
    ctx.fillStyle="#d89a28"; ctx.fillRect(4,bodyY+9,6,20); ctx.fillRect(34,bodyY+10,6,20);
    ctx.fillStyle="#ffd9b1"; ctx.fillRect(10,bodyY+10,24,25);
    ctx.fillStyle="#ffffff"; ctx.fillRect(15,bodyY+19,7,5); ctx.fillRect(27,bodyY+19,7,5);
    ctx.fillStyle="#2d8cff"; ctx.fillRect(17,bodyY+20,4,4);
    if(wink){ ctx.fillStyle="#1d2440"; ctx.beginPath(); ctx.moveTo(27,bodyY+21); ctx.lineTo(35,bodyY+17); ctx.lineTo(35,bodyY+25); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle="#2d8cff"; ctx.fillRect(29,bodyY+20,4,4); }
    ctx.fillStyle="#ff6fb8"; ctx.fillRect(6,bodyY+36,34,26); ctx.fillStyle="#ffd9b1"; ctx.fillRect(-2,bodyY+42,8,14); ctx.fillRect(40,bodyY+42,8,14);
    ctx.fillStyle="#8b2f76";
    if(slide){ ctx.fillRect(4,legY,34,8); ctx.fillRect(25,legY-13,18,8); }
    else if(landing){ ctx.fillRect(8,legY-6,15,8); ctx.fillRect(25,legY-6,16,8); }
    else if(crouch){ ctx.fillRect(9,legY-8,15,8); ctx.fillRect(25,legY-3,16,8); }
    else { ctx.fillRect(11,legY,10,17); ctx.fillRect(26,legY,10,17); }
    ctx.fillStyle="#ffb3d6"; ctx.fillRect(11,legY+(slide?7:crouch?4:16),10,5); ctx.fillRect(28,legY+(slide?-4:crouch?9:16),10,5);
  }
  ctx.restore();
  if(p.spawnTimer>0){ ctx.fillStyle="#fff"; ctx.fillRect(p.x-8,p.y-18,54,8); }
}
function loop(time){ const dt=Math.min(.033,(time-lastTime)/1000||0); lastTime=time; update(dt); draw(); requestAnimationFrame(loop); }

document.querySelectorAll(".character-card").forEach(btn => btn.addEventListener("click",()=>{ selectedHero=btn.dataset.hero; document.querySelectorAll(".character-card").forEach(b=>b.classList.remove("selected")); btn.classList.add("selected"); ui.avatarButton.className=`portrait ${selectedHero}-avatar`; }));
function startGame(){ ui.startPanel.classList.add("hidden"); resetGame(); canvas.focus(); }
ui.startButton.onclick=startGame;
ui.restartButton.onclick=resetGame; ui.avatarButton.ondblclick=activatePower; ui.languageButton.onclick=()=>applyLanguage(currentLang === "en" ? "zh" : "en");
addEventListener("keydown",e=>{ if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault(); keys[e.code]=true; if(!running && ["Space","ArrowUp","ArrowLeft","ArrowRight","KeyA","KeyD","KeyW"].includes(e.code)) running = true; if(e.code==="KeyE") activatePower(); }); addEventListener("keyup",e=>keys[e.code]=false);
[["leftBtn","ArrowLeft"],["rightBtn","ArrowRight"],["downBtn","ArrowDown"],["jumpBtn","Space"]].forEach(([id,code])=>{ const b=document.getElementById(id); b.onpointerdown=e=>{e.preventDefault(); running = true; keys[code]=true;}; b.onpointerup=b.onpointercancel=()=>keys[code]=false; });
canvas.addEventListener("pointerdown",e=>{ canvas.focus(); running = true; keys.Space = true; setTimeout(()=>keys.Space=false, 120); });
function updateSensitivity(){ sensitivity = Number(ui.sensitivityRange.value) / 100; ui.sensitivityValue.textContent = `${ui.sensitivityRange.value}%`; }
ui.sensitivityRange.addEventListener("input", updateSensitivity);
updateSensitivity();
applyLanguage("en"); resetGame(); requestAnimationFrame(loop);
