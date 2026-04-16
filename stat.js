"use strict";

class Stat {
    constructor() {
        this.load();
    }

    load() {
        try {
            const data = JSON.parse(localStorage.getItem('rvb2_stats') || '{}');
            this.corruption = data.corruption || 0;
            this.epargner = data.epargner || 0;
            this.formater = data.formater || 0;
            // ── Pouvoirs débloqués par fusion ──
            this.hasInvis = data.hasInvis || false; // Boss 10 — Touche C
            this.hasClone = data.hasClone || false; // Boss 20 — Touche V
            this.hasRegen = data.hasRegen || false; // Boss 30 — Régénération passive
            this.hasSlowmo = data.hasSlowmo || false; // Boss 40 — Touche X
        } catch (e) {
            this.corruption = 0;
            this.epargner = 0;
            this.formater = 0;
            this.hasInvis = false;
            this.hasClone = false;
            this.hasRegen = false;
            this.hasSlowmo = false;
        }
    }

    save() {
        localStorage.setItem('rvb2_stats', JSON.stringify({
            corruption: this.corruption,
            epargner: this.epargner,
            formater: this.formater,
            hasInvis: this.hasInvis,
            hasClone: this.hasClone,
            hasRegen: this.hasRegen,
            hasSlowmo: this.hasSlowmo
        }));
    }

    addCorruption() { this.corruption++; this.save(); }
    addEpargner() { this.epargner++; this.save(); }
    addFormater() { this.formater++; this.save(); }

    unlockInvis() { this.hasInvis = true; this.save(); }
    unlockClone() {
        this.hasClone = true;
        // Compatibilité avec joueur.js qui lit directement localStorage
        localStorage.setItem('rvb2_power_clone', 'true');
        this.save();
    }
    unlockRegen() {
        this.hasRegen = true;
        localStorage.setItem('rvb2_power_regen', 'true');
        this.save();
    }
    unlockSlowmo() {
        this.hasSlowmo = true;
        localStorage.setItem('rvb2_power_slowmo', 'true');
        this.save();
    }
}

// Instance globale partagée par tous les fichiers
const gameStats = new Stat();
