// ========================================================
// REVEB 2 : MOTEUR GLOBAL DES SUCCÈS ET DES MÉTRIQUES
// Ce fichier doit être inclus dans TOUTES les pages HTML
// ========================================================


// 1. LE DICTIONNAIRE DE TOUS LES SUCCÈS (Incluant les couleurs 'type')
const ACH_DICT = {
  // --- LES 11 FINS ---
  'ACH_END_PASSIF': { name: 'FIN 01 : LE SILENCE', icon: '⏳', type: 'cyan', desc: "Vous avez laissé le temps s'écouler dans la zone de purge." },
  'ACH_END_F_LOUPER': { name: 'FIN 02 : ÉCHEC SYSTÈME', icon: '❌', type: 'cyan', desc: "Tentative de formatage échouée (Barre à 0%)." },
  'ACH_END_F_TOTALE': { name: 'FIN 03 : PURGE TOTALE', icon: '🩸', type: 'rouge', desc: "Formatage parfait d'un monde ravagé." },
  'ACH_END_F_REUSSIS': { name: 'FIN 04 : NETTOYAGE', icon: '🧹', type: 'cyan', desc: "Formatage parfait d'un monde stable." },
  'ACH_END_E_TOUT': { name: 'FIN 05 : LE SAUVEUR', icon: '🕊', type: 'vert', desc: "Vous avez épargné tous les anciens." },
  'ACH_END_E_NORMAL': { name: 'FIN 06 : PITIÉ SÉLECTIVE', icon: '⚖', type: 'vert', desc: "Vous avez épargné, mais pas tout le monde." },
  'ACH_END_FUS_CORRUPT': { name: 'FIN 07 : ASSIMILATION', icon: '🦠', type: 'violet', desc: "Fusion avec de la corruption active." },
  'ACH_END_FUS_PURE': { name: 'FIN 08 : L\'HÉRITAGE', icon: '✨', type: 'violet', desc: "Fusion pure sans corruption." },
  'ACH_END_SEC_SPAK': { name: 'FIN 09 : VÉRITÉ (SPAK)', icon: '👁', type: 'cyan', desc: "Vous avez découvert la commande secrète." },
  'ACH_END_SEC_FAIL': { name: 'FIN 10 : L\'ABÎME', icon: '⬛', type: 'cyan', desc: "Vous vous êtes retourné vers le néant." },
  'ACH_END_ZONE_PURGE': { name: 'FIN 11 : ZONE DE PURGE', icon: '☢', type: 'rouge', desc: "Vous avez choisi de ne pas bouger." },

  // --- COMPLÉTION & BOSS ---
  'ACH_ALL_ENDS': { name: 'L\'ABSOLU', icon: '∞', type: 'gold', desc: "Toutes les fins découvertes." },
  'ACH_SURVIVOR': { name: 'INTRAÇABLE', icon: '🛡', type: 'cyan', desc: "Jeu terminé sans aucune mort." },
  'ACH_BOSS_10': { name: 'PHANT0M ÉCRASÉ', icon: '10', type: 'cyan', desc: "Vous avez vaincu l'entité du Palier 10." },
  'ACH_BOSS_20': { name: 'DÉSYNCHRONISÉ', icon: '20', type: 'cyan', desc: "Vous avez vaincu Sync & Async." },
  'ACH_BOSS_30': { name: 'ARCHITECTE DÉCHU', icon: '30', type: 'cyan', desc: "Vous avez vaincu l'Architecte D.J." },
  'ACH_BOSS_40': { name: 'TEMPS ARRÊTÉ', icon: '40', type: 'cyan', desc: "Vous avez vaincu Chronos." },
  'ACH_BOSS_50': { name: 'LE N.E.A.N.T', icon: '50', type: 'rouge', desc: "Vous avez survécu à l'entité du Palier 50." },

  // --- GAMEPLAY ET SECRETS ---
  'ACH_FIRST_BLOOD': { name: 'PREMIER SANG', icon: '🩸', type: 'rouge', desc: "Formatage de la première cible." },
  'ACH_DASH': { name: 'VITESSE LUMIÈRE', icon: '☄', type: 'cyan', desc: "Capacité Dash utilisée 100 fois." },
  'ACH_INVINCIBLE': { name: 'SOLIDE', icon: '⛰', type: 'vert', desc: "Invincibilité utilisée pour la première fois." },
  'ACH_CLONE': { name: 'DUPLICATION', icon: '⧉', type: 'violet', desc: "Capacité de clonage activée." },
  'ACH_REGEN': { name: 'SANTÉ D\'ENFER', icon: '♥', type: 'vert', desc: "Régénération d'un cœur." },
  'ACH_MARATHON': { name: 'LE MARATHON', icon: '👟', type: 'cyan', desc: "1000 cases parcourues." },
  'ACH_STOCKHOLM': { name: 'SYNDROME DE STOCKHOLM', icon: '🎵', type: 'cyan', desc: "Trop de temps à écouter la musique du menu." },
  'ACH_PENSEE': { name: 'LA PENSÉE LIBRE', icon: '👁', type: 'violet', desc: "Mot de passe de l'archive trouvé." },
  'ACH_VERITE': { name: 'VÉRITÉ CACHÉE', icon: '🔓', type: 'rouge', desc: "Dossier de Corruption forcé." }
};

// 2. LA FONCTION POUR DÉBLOQUER UN SUCCÈS DEPUIS N'IMPORTE OÙ
function unlockAchievement(id) {
  let unlocked = JSON.parse(localStorage.getItem('reveb2_achievements') || '[]');

  if (unlocked.includes(id)) return; // Déjà débloqué

  unlocked.push(id);
  localStorage.setItem('reveb2_achievements', JSON.stringify(unlocked));

  // Si le dictionnaire ne trouve pas l'ID, on met des valeurs par défaut
  let achData = ACH_DICT[id] || { name: 'ANOMALIE INCONNUE', icon: '?' };

  showAchievementPopUp(achData.name, achData.icon);
  checkAllEnds(unlocked); // On vérifie si on a les 10 fins
}

// 3. LA FONCTION QUI GÈRE LE POP-UP VISUEL
function showAchievementPopUp(name, icon) {
  try { if (typeof sfx !== 'undefined' && sfx.unlock) sfx.unlock(); } catch (e) { }

  const popup = document.createElement('div');
  popup.innerHTML = `
    <div style="font-size:2rem; margin-right:15px; color:#00F5FF; text-shadow:0 0 10px #00F5FF;">${icon}</div>
    <div style="display:flex; flex-direction:column;">
      <span style="font-size:0.7rem; color:#888; font-family:'Share Tech Mono';">NOUVELLE ANOMALIE OBSERVÉE</span>
      <span style="font-size:1.1rem; color:#fff; font-family:'Orbitron'; font-weight:bold;">${name}</span>
    </div>
  `;

  Object.assign(popup.style, {
    position: 'fixed', bottom: '-100px', right: '30px', zIndex: '99999',
    background: 'rgba(0, 15, 20, 0.95)', border: '1px solid #00F5FF', borderLeft: '4px solid #00F5FF',
    boxShadow: '0 0 20px rgba(0, 245, 255, 0.3)', padding: '15px 25px', display: 'flex', alignItems: 'center',
    transition: 'bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  });

  document.body.appendChild(popup);
  setTimeout(() => { popup.style.bottom = '30px'; }, 100);
  setTimeout(() => { popup.style.bottom = '-100px'; setTimeout(() => popup.remove(), 600); }, 4000);
}

// 4. VÉRIFICATION DU 100%
function checkAllEnds(unlockedList) {
  const allEnds = [
    'ACH_END_PASSIF', 'ACH_END_F_LOUPER', 'ACH_END_F_TOTALE', 'ACH_END_F_REUSSIS',
    'ACH_END_E_TOUT', 'ACH_END_E_NORMAL', 'ACH_END_FUS_CORRUPT', 'ACH_END_FUS_PURE',
    'ACH_END_SEC_SPAK', 'ACH_END_SEC_FAIL', 'ACH_END_ZONE_PURGE'
  ];
  let hasAll = allEnds.every(end => unlockedList.includes(end));
  if (hasAll && !unlockedList.includes('ACH_ALL_ENDS')) {
    setTimeout(() => unlockAchievement('ACH_ALL_ENDS'), 4500);
  }
}

// 5. FONCTIONS GLOBALES POUR LES COMPTEURS MÉTAS (Ex: Les Dashes)
function addGlobalDash() {
  let dashCount = parseInt(localStorage.getItem('rvb2_global_dashes') || '0');
  dashCount++;
  localStorage.setItem('rvb2_global_dashes', dashCount);

  if (dashCount === 100) {
    unlockAchievement('ACH_DASH');
  }
}

function addGlobalDistance() {
  let dist = parseInt(localStorage.getItem('rvb2_global_dist') || '0');
  dist++;
  localStorage.setItem('rvb2_global_dist', dist);

  if (dist === 1000) {
    unlockAchievement('ACH_MARATHON');
  }
}

// COMPTEUR DE MORTS
function addGlobalDeath() {
  let d = parseInt(localStorage.getItem('rvb2_global_deaths') || '0');
  localStorage.setItem('rvb2_global_deaths', d + 1);
}

// COMPTEUR DE PORTAILS
function addGlobalPortal() {
  let p = parseInt(localStorage.getItem('rvb2_global_portals') || '0');
  localStorage.setItem('rvb2_global_portals', p + 1);
}