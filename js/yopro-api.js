/**
 * YoPRO Arcade Shared API
 * Handles score persistence and qualification logic across the ecosystem.
 */

const YoPRO = {
    KEYS: {
        RUSH: 'yopro_rush_best',
        ARCADE: 'yopro_arcade_best',
        SLOTS: 'yopro_slots_best',
        ROULETTE: 'yopro_roulette_best',
        WALLET: 'yopro_wallet_balance'
    },
    THRESHOLD: 500,

    getScores() {
        return {
            rush: parseInt(localStorage.getItem(this.KEYS.RUSH)) || 0,
            arcade: parseInt(localStorage.getItem(this.KEYS.ARCADE)) || 0,
            slots: parseInt(localStorage.getItem(this.KEYS.SLOTS)) || 0,
            roulette: parseInt(localStorage.getItem(this.KEYS.ROULETTE)) || 0
        };
    },

    getBalance() {
        // Balance is stored explicitly but initialized by sum of action games
        let balance = localStorage.getItem(this.KEYS.WALLET);
        if (balance === null) {
            const scores = this.getScores();
            balance = scores.rush + scores.arcade;
            localStorage.setItem(this.KEYS.WALLET, balance);
        }
        return parseInt(balance);
    },

    transaction(amount) {
        let current = this.getBalance();
        if (current + amount < 0) return false; // Insufficient funds
        localStorage.setItem(this.KEYS.WALLET, current + amount);
        return true;
    },

    saveScore(game, score) {
        const key = this.KEYS[game.toUpperCase()];
        if (!key) return;
        
        const currentBest = parseInt(localStorage.getItem(key)) || 0;
        if (score > currentBest) {
            localStorage.setItem(key, score);
            return true;
        }
        return false;
    },

    isQualified() {
        const scores = this.getScores();
        return scores.rush >= this.THRESHOLD || 
               scores.arcade >= this.THRESHOLD || 
               scores.slots >= this.THRESHOLD || 
               scores.roulette >= this.THRESHOLD;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = YoPRO;
}
