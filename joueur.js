"use strict";

class Joueur {
  constructor() {
    this.gx = 0; this.gy = 0;
    this.px = 0; this.py = 0;
    this.tx = 0; this.ty = 0;
    this.mv = false; this.mT = 0; this.MD = 88;
    this.alive = true; this.inv = 0; this.rot = 0;
    this.pulse = 0; this.sq = 1;
    this.boosted = false; this.bDir = null;
    this.iq = null; this.lDir = { dx: 0, dy: 1 };
    this.dashCD = 0; this.DASH_CD = 1000;
    this.dashAct = false; this.dashT2 = 0;
    this.state = 'idle'; this.gemT = 0;
    this.idleT = 0; this.hurtT = 0; this.happyT = 0;

    // ─── INVISIBILITÉ (Boss 10 fusion) — Touche C ───
    this.invisActive = false;
    this.invisT = 0;
    this.invisCD = 0;
    this.INVIS_MAX_CD = 10000;

    // ─── RALENTI TEMPOREL (Boss 40 fusion) — Touche X ───
    this.slowmoActive = false;
    this.slowmoT = 0;
    this.slowmoCD = 0;
    this.SLOWMO_DURATION = 5000;   // 5 s actif
    this.SLOWMO_MAX_CD = 20000;  // 20 s recharge

    // ─── RÉGÉNÉRATION PASSIVE (Boss 30 fusion) ───
    this.regenTimer = 0;
    this.REGEN_INTERVAL = 20000;   // +1 vie toutes les 20 s




    // ─── EFFETS VISUELS ───
    this.trail = []; // Pour la traînée de dash

    // ─── CLONE ───
    this.cloneActive = false;
    this.hasPowerClone = (typeof localStorage !== 'undefined' && localStorage.getItem('rvb2_power_clone') === 'true');
    this.origGx = 0; this.origGy = 0;
    this.origPx = 0; this.origPy = 0;
    this._glitchT = 0; this._glitchX = 0; this._glitchY = 0;
  }

  refreshPowers() {
    this.hasPowerClone = (typeof localStorage !== 'undefined' && localStorage.getItem('rvb2_power_clone') === 'true');
  }

  reset(sx, sy) {
    this.cloneActive = false;
    this.gx = sx; this.gy = sy;
    this.px = px2(sx); this.py = py2(sy);
    this.tx = this.px; this.ty = this.py;
    this.mv = false; this.alive = true; this.inv = 800;
    this.rot = 0; this.pulse = 0; this.sq = 1;
    this.boosted = false; this.bDir = null;
    this.dashAct = false; this.dashT2 = 0; this.dashCD = 0;
    this.trail = [];
    this.refreshPowers();
    burst(this.px, this.py, col === 'red' ? K.red : K.blue, 12, 4, 400);
  }

  tryClone() {
    if (!this.hasPowerClone || !this.alive || _tr) return;
    if (this.cloneActive) { this.killClone(); return; }
    if (this.mv || this.dashAct || this.boosted) return;
    this.origGx = this.gx; this.origGy = this.gy;
    this.origPx = this.px; this.origPy = this.py;
    this.cloneActive = true;
    if (typeof unlockAchievement === 'function') unlockAchievement('ACH_CLONE');
    this.inv = 250; this._glitchT = 0;
    spark(this.px, this.py, '#44DDFF', 14, 4, 450);
    ono('DÉDOUBLEMENT!', this.px, this.py - 32, '#44DDFF');
    if (typeof sfx !== 'undefined') sfx.dash();
  }

  killClone() {
    if (!this.cloneActive) return;
    spark(this.px, this.py, '#8844FF', 10, 3, 280);
    ono('RETOUR!', this.px, this.py - 26, '#8844FF');
    this.gx = this.origGx; this.gy = this.origGy;
    this.px = this.origPx; this.py = this.origPy;
    this.tx = this.px; this.ty = this.py;
    this.mv = false; this.mT = 0;
    this.dashAct = false; this.inv = 400;
    this.cloneActive = false;
  }

  hurtOriginal() {
    if (!this.alive) return;
    lives--;
    this.hurtT = 900;
    if (lives <= 0) { this.cloneActive = false; this.kill(); return; }
    this.inv = 1200;
    if (typeof sfx !== 'undefined') sfx.hit();
    burst(this.origPx, this.origPy, K.red, 16, 4, 350);
    addSh(7, 200); fScr(K.red, 150);
    ono('HIT! (ORIG)', this.origPx, this.origPy - 26, K.red);
  }

  tryMove(dx, dy) {
    if (this.mv || !this.alive || _tr || this.dashAct || this.boosted) return;
    this.lDir = { dx, dy };
    const nx = this.gx + dx, ny = this.gy + dy;
    if (!solid(nx, ny, false)) return;
    if (!this.cloneActive) {
      for (const t of traps) {
        if (t.k === 'laser' && t.fir) {
          if (t.ax === 'h' && ny === t.rc) return;
          if (t.ax === 'v' && nx === t.rc) return;
        }
      }
    }
    this.gx = nx; this.gy = ny;
    this.tx = px2(nx); this.ty = py2(ny);
    this.mv = true; this.mT = 0;
    this.rot = Math.atan2(dy, dx); this.sq = 0.7;
    if (typeof sfx !== 'undefined') sfx.move();
    if (typeof addGlobalDistance === 'function') {
      addGlobalDistance();
    }
  }

  tryDash() {
    if (this.dashCD > 0 || !this.alive || this.mv || this.dashAct || _tr || this.boosted) return;
    const { dx, dy } = this.lDir;
    const nx = this.gx + dx * 2, ny = this.gy + dy * 2;
    if (!inB(nx, ny) || !solid(nx, ny, false)) return;
    this.dashAct = true; this.dashT2 = 0; this.dashCD = this.DASH_CD;
    this.gx = nx; this.gy = ny;
    this.tx = px2(nx); this.ty = py2(ny);
    this.mv = true; this.mT = 0; this.inv = 120;
    if (typeof sfx !== 'undefined') sfx.dash();
    spark(this.px, this.py, K.pur, 10, 4, 300);
    ono('DASH!', this.px, this.py - 25, K.pur);
    addSh(3, 120);
    if (typeof addGlobalDash === 'function') {
      addGlobalDash();
    }
  }

  tryInvis() {
    if (typeof gameStats === 'undefined' || !gameStats.hasInvis) return;
    if (this.invisActive || this.invisCD > 0) return;
    this.invisActive = true;
    if (typeof unlockAchievement === 'function') unlockAchievement('ACH_INVINCIBLE');
    this.invisT = 3000;
    this.invisCD = this.INVIS_MAX_CD;
    if (typeof ono === 'function') ono('INVISIBLE!', this.px, this.py - 30, '#8A2BE2');
    if (typeof spark === 'function') spark(this.px, this.py, '#8A2BE2', 15, 4, 600);
  }

  trySlowmo() {
    if (typeof gameStats === 'undefined' || !gameStats.hasSlowmo) return;
    if (this.slowmoActive || this.slowmoCD > 0) return;
    this.slowmoActive = true;
    this.slowmoT = this.SLOWMO_DURATION;
    this.slowmoCD = this.SLOWMO_MAX_CD;
    if (typeof ono === 'function') ono('TEMPS RALENTI!', this.px, this.py - 34, '#FFD700');
    if (typeof spark === 'function') spark(this.px, this.py, '#FFD700', 18, 5, 700);
  }

  hurt() {
    if (!this.alive) return;
    if (this.invisActive) return;
    if (this.cloneActive) {
      if (this.inv > 0) return;
      spark(this.px, this.py, '#FF00AA', 12, 3, 300);
      ono('CLONE DÉTRUIT!', this.px, this.py - 28, '#FF00AA');
      addSh(4, 150); fScr('#FF00AA', 120);
      this.killClone(); return;
    }
    if (this.inv > 0 || isOnSafe()) return;
    lives--;
    this.hurtT = 900;
    if (lives <= 0) { this.kill(); return; }
    this.inv = 1200;
    if (typeof sfx !== 'undefined') sfx.hit();
    burst(this.px, this.py, K.red, 16, 4, 350);
    addSh(7, 200); fScr(K.red, 150);
    ono('HIT!', this.px, this.py - 26, K.red);

  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    if (typeof addGlobalDeath === 'function') addGlobalDeath();
    if (typeof lives !== 'undefined') lives = 0;
    this.cloneActive = false;

    if (typeof sfx !== 'undefined') sfx.die();
    if (typeof score !== 'undefined' && typeof best !== 'undefined') {
      if (score > best) { best = score; if (typeof doS !== 'undefined') doS(); }
    }

    const playerCol = (typeof col !== 'undefined' && col === 'blue') ? K.blue : K.red;
    burst(this.px, this.py, playerCol, 45, 6, 750);
    ring(this.px, this.py, playerCol, TSZ * 1.4);
    addSh(13, 450);

    // --- SÉCURITÉ : Ne casse le sol que dans le jeu principal ---
    if (typeof dTiles !== 'undefined' && typeof gSize !== 'undefined' && typeof T !== 'undefined') {
      dTiles = [];
      for (let y = 0; y < gSize; y++) {
        for (let x = 0; x < gSize; x++) {
          if (grid[y][x] === T.HOLE) continue;
          const a = Math.random() * Math.PI * 2, s = 1.5 + Math.random() * 3.5;
          dTiles.push({
            x: OX + x * TSZ, y: OY + y * TSZ,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2.5,
            rot: Math.random() * Math.PI * 2, rv: (Math.random() - .5) * 0.18,
            c: grid[y][x] === T.PORTAL ? K.gold : playerCol,
            a: 1, sz: TSZ - 2
          });
        }
      }
    }

    if (typeof st !== 'undefined' && typeof ST !== 'undefined') st = ST.DEAD;
    if (typeof dAnim !== 'undefined') dAnim = 0;
    if (typeof deadSel !== 'undefined') deadSel = 0;

    ono('SYSTEM CRASH!', this.px - 28, this.py - 38, K.red);
    fScr(K.red, 280);
  }

  update(dt) {
    if (this.iq && !this.mv && !this.boosted) { this.tryMove(this.iq.dx, this.iq.dy); this.iq = null; }
    this.dashCD = Math.max(0, this.dashCD - dt);

    // ── Invisibilité ──
    if (this.invisActive) {
      this.invisT -= dt;
      if (this.invisT <= 0) this.invisActive = false;
    }
    if (this.invisCD > 0) this.invisCD = Math.max(0, this.invisCD - dt);

    // ── Ralenti temporel ──
    if (this.slowmoActive) {
      this.slowmoT -= dt;
      if (this.slowmoT <= 0) { this.slowmoActive = false; this.slowmoT = 0; }
    }
    if (this.slowmoCD > 0) this.slowmoCD = Math.max(0, this.slowmoCD - dt);

    // ── Régénération passive (+1 vie / 20 s) ──
    if (typeof gameStats !== 'undefined' && gameStats.hasRegen && typeof lives !== 'undefined' && typeof maxLives !== 'undefined') {
      this.regenTimer += dt;
      if (this.regenTimer >= this.REGEN_INTERVAL) {
        this.regenTimer = 0;
        if (lives < maxLives) {
          lives++;
          if (typeof unlockAchievement === 'function') unlockAchievement('ACH_REGEN');
          if (typeof ono === 'function') ono('+1 VIE (REGEN)', this.px, this.py - 38, '#00FF41');
          if (typeof spark === 'function') spark(this.px, this.py, '#00FF41', 10, 3, 400);
        }
      }
    }

    // GESTION DE LA TRAÎNÉE DE DASH/BOOST
    if (this.dashAct || this.boosted) {
      this.trail.push({ x: this.px, y: this.py, life: 180, ml: 180, sqX: this.dashAct ? 1.25 : 1.1, sqY: this.dashAct ? 0.75 : 0.9, state: this.state });
    }
    for (let tr of this.trail) tr.life -= dt;
    this.trail = this.trail.filter(t => t.life > 0);

    if (this.dashAct) { this.dashT2 += dt; if (this.dashT2 >= 110) { this.dashAct = false; this.dashT2 = 0; } }
    if (!this.cloneActive && this.boosted && this.bDir && !this.mv) {
      const nx = this.gx + this.bDir.dx, ny = this.gy + this.bDir.dy;
      if (inB(nx, ny) && solid(nx, ny, false)) {
        this.gx = nx; this.gy = ny; this.tx = px2(nx); this.ty = py2(ny); this.mv = true; this.mT = 0;
      } else { this.boosted = false; this.bDir = null; }
    }
    if (this.mv) {
      this.mT += dt;
      const sp = this.dashAct ? 4 : (this.boosted ? 5 : 7);
      this.px = lerp(this.px, this.tx, Math.min(dt / this.MD * sp, 1));
      this.py = lerp(this.py, this.ty, Math.min(dt / this.MD * sp, 1));
      if (this.mT >= this.MD) {
        this.mv = false; this.px = this.tx; this.py = this.ty; this.sq = 1.12;
        spark(this.px, this.py, col === 'red' ? K.red : K.blue, 3, 1.5, 150);
        this.landTile();
      }
    }
    this.inv = Math.max(0, this.inv - dt);
    this.pulse += dt;
    this.sq = lerp(this.sq, 1, Math.min(dt * 0.012, 1));

    if (this.cloneActive) {
      this._glitchT += dt;
      if (this._glitchT > 80) {
        this._glitchT = 0;
        this._glitchX = (Math.random() - 0.5) * 4;
        this._glitchY = (Math.random() - 0.5) * 2;
      }
      if (this.alive && this.inv <= 0) {
        const og = grid[this.origGy]?.[this.origGx];
        if (og === T.PURPLE) { ono('NÉANT! (ORIG)', this.origPx, this.origPy - 26, K.pur); this.hurtOriginal(); }
      }
    }

    if (!this.mv && this.alive && this.inv <= 0 && !isOnSafe()) {
      if (grid[this.gy]?.[this.gx] === T.PURPLE) { ono('NÉANT!', this.px, this.py - 26, K.pur); this.hurt(); }
    }
    this.updateState(dt);
  }

  landTile() {
    if (!this.alive) return;
    if (!this.cloneActive) {
      const conv = traps.find(t => t.k === 'conv' && t.x === this.gx && t.y === this.gy);
      if (conv && !this.boosted) {
        const nx = this.gx + conv.dx, ny = this.gy + conv.dy;
        if (inB(nx, ny) && solid(nx, ny, false)) {
          setTimeout(() => { if (!this.alive || this.mv) return; this.gx = nx; this.gy = ny; this.tx = px2(nx); this.ty = py2(ny); this.mv = true; this.mT = 0; if (typeof sfx !== 'undefined') sfx.move(); }, 120);
        }
      }
      const boost = traps.find(t => t.k === 'boost' && t.x === this.gx && t.y === this.gy);
      if (boost) { this.boosted = true; this.bDir = { dx: boost.dx, dy: boost.dy }; burst(this.px, this.py, K.gold, 8, 3, 280); if (typeof sfx !== 'undefined') sfx.boost(); }
    }
    const tk2 = `${this.gx},${this.gy}`;
    if (grid[this.gy]?.[this.gx] === T.GHOST && !ghostBrk[tk2]?.b) ghostBrk[tk2] = { t: 1500, b: false };
    if (!this.cloneActive) {
      for (const t of traps) {
        if (t.k === 'tele' && t.cooldown <= 0) {
          if (this.gx === t.ax && this.gy === t.ay) { this.gx = t.bx; this.gy = t.by; this.px = px2(t.bx); this.py = py2(t.by); this.tx = this.px; this.ty = this.py; t.cooldown = 1000; burst(this.px, this.py, K.pur, 15, 5, 400); ono('WARP!', this.px, this.py - 20, K.pur); break; }
          if (this.gx === t.bx && this.gy === t.by) { this.gx = t.ax; this.gy = t.ay; this.px = px2(t.ax); this.py = py2(t.ay); this.tx = this.px; this.ty = this.py; t.cooldown = 1000; burst(this.px, this.py, K.pur, 15, 5, 400); ono('WARP!', this.px, this.py - 20, K.pur); break; }
        }
      }
    }
    for (const torch of torches) {
      if (!torch.lit && Math.abs(torch.x - this.gx) <= 1 && Math.abs(torch.y - this.gy) <= 1) {
        torch.lit = true; burst(px2(torch.x), py2(torch.y), K.gold, 12, 3, 350); ono('TORCHE!', px2(torch.x), py2(torch.y) - 18, K.gold);
      }
    }
  }

  updateState(dt) {
    if (!this.alive) { this.state = 'idle'; return; }
    if (this.hurtT > 0) this.hurtT = Math.max(0, this.hurtT - dt);
    if (this.gemT > 0) this.gemT = Math.max(0, this.gemT - dt);
    if (this.happyT > 0) this.happyT = Math.max(0, this.happyT - dt);
    if (this.mv || (typeof st !== 'undefined' && st !== ST.PLAY)) this.idleT = 0; else this.idleT += dt;
    if (this.idleT >= 30000 && Math.random() < .04) {
      parts.push({ x: this.px + rng(-TSZ * .18, TSZ * .18), y: this.py - TSZ * .3, vx: rng(-.3, .3), vy: -(.45 + Math.random() * .35), c: '#9977cc', life: 1100, ml: 1100, sz: 6 + Math.random() * 5, g: -.008, zzz: true });
    }
    if (this.cloneActive) { this.state = 'idle'; return; }
    if (this.happyT > 0) { this.state = 'happy'; return; }
    if (this.hurtT > 0) { this.state = 'hurt'; return; }
    if (this.dashAct) { this.state = 'dash'; return; }
    if (this.gemT > 0) { this.state = 'gem'; return; }
    if (typeof st !== 'undefined' && st === ST.WIN) { this.state = 'happy'; return; }
    if (typeof rmb !== 'undefined' && rmb) { this.state = 'scan'; return; }
    if (this.idleT >= 30000) { this.state = 'sleep'; return; }
    if (this.idleT >= 20000) { this.state = 'play'; return; }
    this.state = 'idle';
  }

  _clrAdd(hex, v, alpha = 1) {
    if (!hex || hex[0] !== '#') return hex;
    let r, g, b;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    r = clamp(r + v, 0, 255);
    g = clamp(g + v, 0, 255);
    b = clamp(b + v, 0, 255);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _drawCubeAt(cx, now, TSZ, x, y, bodyCol, glowCol, glowAmt, sqX, sqY, shakeX, shakeY, eyeState, alphaParam) {
    const s = TSZ * 0.28, isoX = s * 0.48, isoY = s * 0.28;
    const globalA = alphaParam !== undefined ? alphaParam : 1;

    // Si "none" (pour les traînées légères), on dessine juste le contour du corps
    if (eyeState === 'none') {
      cx.save();
      cx.globalAlpha = globalA;
      cx.translate(x + shakeX, y + shakeY);
      cx.scale(sqX, sqY);
      glow(glowCol, glowAmt);
      cx.strokeStyle = glowCol; cx.lineWidth = 1.5;
      cx.strokeRect(-s, -s, s * 2, s * 2);
      noGlow();
      cx.restore();
      return;
    }

    cx.save();
    cx.globalAlpha = globalA;
    cx.translate(x + shakeX, y + shakeY);
    cx.scale(sqX, sqY);

    const floatY = (eyeState === 'idle' || eyeState === 'sleep') ? Math.sin(now / 350) * (s * 0.15) : 0;
    cx.translate(0, floatY);

    // 1. Aura Globale Externe
    glow(glowCol, glowAmt * 1.5);
    cx.fillStyle = glowCol;
    cx.globalAlpha = globalA * 0.15;
    cx.beginPath(); cx.arc(0, 0, s * 1.4, 0, Math.PI * 2); cx.fill();
    cx.globalAlpha = globalA;

    // 2. Faces Isométriques en Verre Épais
    noGlow();
    cx.lineWidth = 1.5;
    cx.strokeStyle = glowCol;

    cx.fillStyle = this._clrAdd(bodyCol, -40, 0.85);
    cx.beginPath(); cx.moveTo(s, -s); cx.lineTo(s + isoX, -s - isoY); cx.lineTo(s + isoX, s - isoY); cx.lineTo(s, s); cx.closePath();
    cx.fill(); cx.stroke();

    cx.fillStyle = this._clrAdd(bodyCol, 40, 0.9);
    cx.beginPath(); cx.moveTo(-s, -s); cx.lineTo(s, -s); cx.lineTo(s + isoX, -s - isoY); cx.lineTo(-s + isoX, -s - isoY); cx.closePath();
    cx.fill(); cx.stroke();

    // 3. Le Noyau d'Énergie Interne (Losange)
    glow(glowCol, glowAmt);
    const corePulse = 0.8 + Math.sin(now / 150) * 0.2;
    cx.fillStyle = '#ffffff';
    cx.globalAlpha = globalA * 0.9;
    cx.beginPath();
    cx.moveTo(0, -s * 0.65 * corePulse);
    cx.lineTo(s * 0.45 * corePulse, 0);
    cx.lineTo(0, s * 0.65 * corePulse);
    cx.lineTo(-s * 0.45 * corePulse, 0);
    cx.closePath(); cx.fill();
    cx.globalAlpha = globalA;

    // 4. Face Avant (Vitre)
    cx.fillStyle = this._clrAdd(bodyCol, -10, 0.65);
    cx.fillRect(-s, -s, s * 2, s * 2);

    cx.strokeStyle = 'rgba(255,255,255,0.6)';
    cx.lineWidth = 1.2;
    cx.beginPath(); cx.moveTo(-s, s); cx.lineTo(-s, -s); cx.lineTo(s, -s); cx.stroke();

    cx.strokeStyle = glowCol;
    cx.lineWidth = 2;
    cx.strokeRect(-s, -s, s * 2, s * 2);

    // 5. Visage Holographique (Dessiné avec des TRAITS)
    let showFace = true, faceOffX = 0;
    if (this.lDir.dy === -1) showFace = false;
    else if (this.lDir.dx === -1) faceOffX = -s * 0.45;
    else if (this.lDir.dx === 1) faceOffX = s * 0.45;

    if (showFace) {
      cx.save();
      cx.translate(faceOffX, 0);
      cx.globalCompositeOperation = 'screen';

      const eyeY = -s * 0.15, ex1 = -s * 0.4, ex2 = s * 0.4, eW = s * 0.25, mY = s * 0.35;
      const faceColor = eyeState === 'hurt' ? '#FF2222' : (eyeState === 'sleep' ? '#5577AA' : '#FFFFFF');

      // Joues LED
      if (eyeState !== 'sleep' && eyeState !== 'hurt') {
        cx.fillStyle = 'rgba(255,100,150,0.6)';
        cx.beginPath(); cx.ellipse(ex1, eyeY + eW * 1.5, eW * 0.8, eW * 0.4, 0, 0, Math.PI * 2); cx.fill();
        cx.beginPath(); cx.ellipse(ex2, eyeY + eW * 1.5, eW * 0.8, eW * 0.4, 0, 0, Math.PI * 2); cx.fill();
      }

      cx.strokeStyle = faceColor;
      cx.lineWidth = Math.max(2, s * 0.12);
      cx.lineCap = 'round';
      cx.lineJoin = 'round';

      // ── YEUX (CONSTRUITS EN LIGNES) ──
      if (eyeState === 'hurt') {
        // Yeux plissés > <
        cx.beginPath(); cx.moveTo(ex1 - eW, eyeY - eW * 0.8); cx.lineTo(ex1 + eW * 0.5, eyeY); cx.lineTo(ex1 - eW, eyeY + eW * 0.8); cx.stroke();
        cx.beginPath(); cx.moveTo(ex2 + eW, eyeY - eW * 0.8); cx.lineTo(ex2 - eW * 0.5, eyeY); cx.lineTo(ex2 + eW, eyeY + eW * 0.8); cx.stroke();
      } else if (eyeState === 'happy' || eyeState === 'gem') {
        // Yeux souriants ^ ^
        cx.beginPath(); cx.moveTo(ex1 - eW, eyeY + eW * 0.5); cx.quadraticCurveTo(ex1, eyeY - eW * 1.2, ex1 + eW, eyeY + eW * 0.5); cx.stroke();
        cx.beginPath(); cx.moveTo(ex2 - eW, eyeY + eW * 0.5); cx.quadraticCurveTo(ex2, eyeY - eW * 1.2, ex2 + eW, eyeY + eW * 0.5); cx.stroke();
      } else if (eyeState === 'sleep') {
        // Yeux fermés avec une petite courbe
        cx.beginPath(); cx.moveTo(ex1 - eW, eyeY + eW * 0.5); cx.quadraticCurveTo(ex1, eyeY + eW * 0.8, ex1 + eW, eyeY + eW * 0.5); cx.stroke();
        cx.beginPath(); cx.moveTo(ex2 - eW, eyeY + eW * 0.5); cx.quadraticCurveTo(ex2, eyeY + eW * 0.8, ex2 + eW, eyeY + eW * 0.5); cx.stroke();
        // Bulle Zzz
        cx.lineWidth = 1;
        cx.beginPath(); cx.arc(-s * 0.6, -s * 0.8, s * 0.2, 0, Math.PI * 2); cx.stroke();
      } else if (eyeState === 'dash' || eyeState === 'scan') {
        // Yeux déterminés/fâchés (contours inclinés)
        cx.beginPath(); cx.moveTo(ex1 - eW, eyeY + eW * 0.3); cx.lineTo(ex1 + eW * 0.3, eyeY - eW * 0.8); cx.lineTo(ex1 + eW, eyeY + eW * 0.3); cx.closePath(); cx.stroke();
        cx.beginPath(); cx.moveTo(ex2 + eW, eyeY + eW * 0.3); cx.lineTo(ex2 - eW * 0.3, eyeY - eW * 0.8); cx.lineTo(ex2 - eW, eyeY + eW * 0.3); cx.closePath(); cx.stroke();
      } else {
        // Yeux normaux (Contour en losange / amande)
        cx.beginPath(); cx.moveTo(ex1 - eW, eyeY); cx.lineTo(ex1, eyeY - eW * 0.6); cx.lineTo(ex1 + eW, eyeY); cx.lineTo(ex1, eyeY + eW * 0.6); cx.closePath(); cx.stroke();
        cx.beginPath(); cx.moveTo(ex2 - eW, eyeY); cx.lineTo(ex2, eyeY - eW * 0.6); cx.lineTo(ex2 + eW, eyeY); cx.lineTo(ex2, eyeY + eW * 0.6); cx.closePath(); cx.stroke();

        // Pupilles
        cx.fillStyle = faceColor;
        cx.beginPath(); cx.arc(ex1 + (this.lDir.dx * eW * 0.3), eyeY, eW * 0.3, 0, Math.PI * 2); cx.fill();
        cx.beginPath(); cx.arc(ex2 + (this.lDir.dx * eW * 0.3), eyeY, eW * 0.3, 0, Math.PI * 2); cx.fill();
      }

      // ── BOUCHE (EN LIGNES) ──
      cx.beginPath();
      if (eyeState === 'hurt') {
        // Bouche en zig zag
        cx.moveTo(-eW * 0.6, mY); cx.lineTo(-eW * 0.2, mY - eW * 0.4); cx.lineTo(eW * 0.2, mY + eW * 0.4); cx.lineTo(eW * 0.6, mY);
      } else if (eyeState === 'happy' || eyeState === 'gem') {
        // Grande bouche ouverte souriante :D
        cx.moveTo(-eW * 0.8, mY); cx.quadraticCurveTo(0, mY + eW * 1.5, eW * 0.8, mY);
        cx.fillStyle = '#ff6688'; cx.fill();
      } else if (eyeState === 'dash' || eyeState === 'scan') {
        // Petite moue concentrée (triangle)
        cx.moveTo(-eW * 0.5, mY + eW * 0.3); cx.lineTo(0, mY - eW * 0.2); cx.lineTo(eW * 0.5, mY + eW * 0.3);
      } else if (eyeState !== 'sleep') {
        // Sourire léger au repos
        cx.moveTo(-eW * 0.5, mY); cx.quadraticCurveTo(0, mY + eW * 0.5, eW * 0.5, mY);
      }
      cx.stroke();

      cx.restore();
    }
    cx.restore();
  }

  draw(cx, now, TSZ) {
    if (!this.alive) return;
    const ec = col === 'red' ? K.red : K.blue;
    const x = this.px, y = this.py;
    let bodyCol = ec, glowCol = ec, glowAmt = 22, shakeX = 0, shakeY = 0, sqX = 1, sqY = this.sq;

    switch (this.state) {
      case 'dash': glowAmt = 35; sqX = 1.35; sqY = 0.65; break;
      case 'hurt': bodyCol = '#CC0022'; glowCol = K.red; glowAmt = 35; sqX = 0.9 + Math.sin(now * .018) * .1; sqY = 0.9 + Math.cos(now * .022) * .1; shakeX = Math.sin(now * .09) * 3.5; shakeY = Math.cos(now * .11) * 2.5; break;
      case 'scan': bodyCol = '#AA8800'; glowCol = K.gold; glowAmt = 30; break;
      case 'gem': bodyCol = '#009930'; glowCol = K.green; glowAmt = 30; sqX = 1 + Math.sin(now * .018) * .06; sqY = 1 + Math.cos(now * .022) * .06; break;
      case 'happy': bodyCol = '#CC8800'; glowCol = K.gold; glowAmt = 30; sqX = 1 + Math.sin(now * .02) * .07; sqY = 1 + Math.sin(now * .015) * .05; break;
      case 'sleep': bodyCol = '#1c1c38'; glowCol = '#444477'; glowAmt = 10; sqX = 1; sqY = 0.88; break;
      default: sqY = (this.sq) * (1 + Math.sin(now / 900) * .03); break;
    }

    // ─── GESTION DE L'INVISIBILITÉ ───
    const playerAlpha = this.invisActive ? 0.25 : 1; // Devient très transparent si invisible

    // ── CERCLE DE CIBLAGE AU SOL ──
    // (On le cache aussi quand le joueur est invisible)
    if (!this.cloneActive && this.state !== 'hurt' && !this.invisActive) {
      cx.save();
      cx.translate(x, y + TSZ * 0.35);
      cx.scale(1, 0.5);
      cx.rotate(now / 500);
      glow(glowCol, 10);
      cx.strokeStyle = `rgba(255,255,255,0.2)`;
      cx.lineWidth = 1.5;
      cx.beginPath(); cx.arc(0, 0, TSZ * 0.45, 0, Math.PI * 2); cx.stroke();
      cx.beginPath();
      for (let i = 0; i < 4; i++) {
        cx.rotate(Math.PI / 2); cx.moveTo(TSZ * 0.35, 0); cx.lineTo(TSZ * 0.55, 0);
      }
      cx.stroke();
      noGlow();
      cx.restore();
    }

    // ── TRAÎNÉE DE DASH ──
    for (let tr of this.trail) {
      let alpha = (tr.life / tr.ml) * 0.4 * playerAlpha; // La traînée devient aussi transparente
      this._drawCubeAt(cx, now, TSZ, tr.x, tr.y, bodyCol, glowCol, glowAmt / 2, tr.sqX, tr.sqY, 0, 0, 'none', alpha);
    }

    // ── DESSIN DU JOUEUR (OU CLONE) ──
    if (this.cloneActive) {
      this._drawCubeAt(cx, now, TSZ, this.origPx, this.origPy, '#1a1a22', '#333344', 5, 1, 0.9, 0, 0, 'sleep', 0.6);
      cx.save(); cx.globalAlpha = 0.6; cx.font = 'bold 8px Orbitron'; cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.fillStyle = '#8888AA'; cx.fillText('HORS LIGNE', this.origPx, this.origPy - TSZ * .36); cx.restore();

      cx.save(); cx.globalCompositeOperation = 'screen';
      this._drawCubeAt(cx, now, TSZ, x + this._glitchX * 2.5, y + this._glitchY, '#FF0033', '#FF0033', 15, sqX, sqY, shakeX, shakeY, 'none', 0.3 * playerAlpha);
      cx.restore();

      cx.save();
      this._drawCubeAt(cx, now, TSZ, x + this._glitchX, y + this._glitchY, '#0055AA', '#00FFFF', 40, sqX, sqY, shakeX, shakeY, this.state, 0.85 * playerAlpha);
      cx.globalAlpha = 0.2 * playerAlpha; cx.fillStyle = '#fff';
      cx.globalCompositeOperation = 'overlay';
      const s2 = TSZ * 0.35;
      for (let sl = -s2; sl < s2; sl += 3) cx.fillRect(x + this._glitchX - s2, y + this._glitchY + sl, s2 * 2, 1);
      cx.restore();

      cx.save(); cx.globalAlpha = (0.5 + Math.abs(Math.sin(now / 200)) * 0.5) * playerAlpha; cx.font = 'bold 8px Orbitron'; cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.fillStyle = '#00FFFF'; cx.fillText('[V] CLONE', x + this._glitchX, y + this._glitchY - TSZ * .38); cx.restore();
    } else {
      // ON APPLIQUE playerAlpha ICI ▼
      this._drawCubeAt(cx, now, TSZ, x, y, bodyCol, glowCol, glowAmt, sqX, sqY, shakeX, shakeY, this.state, playerAlpha);
    }

    // ── BOUCLIER D'INVINCIBILITÉ ──
    // On le cache si on est furtif pour ne pas trahir notre position
    if (this.inv > 0 && this.state !== 'hurt' && !this.invisActive) {
      const ax = x + (this.cloneActive ? this._glitchX : 0), ay = y + (this.cloneActive ? this._glitchY : 0);
      const invRatio = Math.min(1, this.inv / 500);
      cx.save();
      cx.globalAlpha = invRatio * 0.7;
      cx.translate(ax, ay);
      cx.rotate(now / 500);
      glow(K.gold, 25);
      cx.strokeStyle = K.gold;
      cx.lineWidth = 2.5;
      cx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a2 = (i / 6) * Math.PI * 2;
        const rad = TSZ * 0.55 + Math.sin(now / 100 + i) * 3;
        if (i === 0) cx.moveTo(Math.cos(a2) * rad, Math.sin(a2) * rad);
        else cx.lineTo(Math.cos(a2) * rad, Math.sin(a2) * rad);
      }
      cx.closePath(); cx.stroke();

      cx.globalAlpha = invRatio * 0.25;
      cx.lineWidth = 1.5;
      cx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a2 = (i / 6) * Math.PI * 2;
        cx.moveTo(0, 0); cx.lineTo(Math.cos(a2) * (TSZ * 0.55), Math.sin(a2) * (TSZ * 0.55));
      }
      cx.stroke();
      cx.restore();
      noGlow();
    }

    // ── HUD Dash ──
    if (this.dashCD > 0) {
      const pr = 1 - this.dashCD / this.DASH_CD;
      cx.strokeStyle = 'rgba(138,43,226, 0.4)';
      cx.lineWidth = 3;
      cx.beginPath(); cx.arc(x, y, TSZ * 0.48, -Math.PI / 2, -Math.PI / 2 + pr * Math.PI * 2); cx.stroke();
      cx.fillStyle = K.pur;
      cx.beginPath(); cx.arc(x + Math.cos(-Math.PI / 2 + pr * Math.PI * 2) * TSZ * 0.48, y + Math.sin(-Math.PI / 2 + pr * Math.PI * 2) * TSZ * 0.48, 2.5, 0, Math.PI * 2); cx.fill();
    }

    // ── Indicateur Pouvoir Clone ──
    if (this.hasPowerClone && !this.cloneActive) {
      cx.save(); cx.globalAlpha = 0.3 + Math.abs(Math.sin(now / 600)) * 0.3; cx.font = 'bold 8px Orbitron'; cx.textAlign = 'center'; cx.textBaseline = 'bottom'; cx.fillStyle = '#00FFFF'; cx.fillText('[V]', x, y - TSZ * .38); cx.restore();
    }
  }
}