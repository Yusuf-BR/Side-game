/**
 * YO PRO ARCADE: PRO EDITION - ENGINE
 */

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.GRID_WIDTH * 30;
        this.canvas.height = CONFIG.GRID_HEIGHT * 30;

        this.state = {
            running: false,
            score: 0,
            best: YoPRO.getScores().arcade,
            level: 0,
            power: 0,
            metabolism: 50, // Initial fuel level
            buffer: CONFIG.DIRS.NONE,
            raf: null
        };

        this.maze = new Maze(this.ctx);
        this.player = new Player(this.ctx, this.maze);
        this.ghosts = CONFIG.GHOSTS.map(d => new Ghost(this.ctx, this.maze, d));

        this.init();
    }

    init() {
        window.addEventListener('keydown', e => {
            if (e.key === 'ArrowUp')    { e.preventDefault(); this.state.buffer = CONFIG.DIRS.UP; }
            if (e.key === 'ArrowDown')  { e.preventDefault(); this.state.buffer = CONFIG.DIRS.DOWN; }
            if (e.key === 'ArrowLeft')  { e.preventDefault(); this.state.buffer = CONFIG.DIRS.LEFT; }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.state.buffer = CONFIG.DIRS.RIGHT; }
        });

        document.getElementById('btn-start').onclick = () => this.launch();
        document.getElementById('btn-retry').onclick = () => this.restart();
        
        this.syncHUD();
        this.draw(); // Initial menu visual
    }

    reset() {
        this.state.score = 0;
        this.state.level = 0;
        this.state.power = 0;
        this.state.metabolism = 50;
        this.state.buffer = CONFIG.DIRS.NONE;

        const f = CONFIG.FLAVORS[0];
        this.maze.reset(f.maze);
        this.player.reset(9, 15);
        this.ghosts = CONFIG.GHOSTS.map(d => new Ghost(this.ctx, this.maze, d));

        document.body.className = 'theme-' + f.id;
        document.getElementById('flavor-name').textContent = f.name;
        document.getElementById('level-num').textContent = 'CIRCUIT 01';
        document.getElementById('intro-flavor-tag').textContent = f.name;
    }

    launch() {
        document.getElementById('overlay-menu').classList.remove('active');
        document.getElementById('overlay-death').classList.remove('active');
        this.flash('READY?');
        setTimeout(() => {
            this.flash('GO!', 500);
            this.state.running = true;
            this.loop();
        }, 1000);
    }

    restart() {
        if (this.state.raf) cancelAnimationFrame(this.state.raf);
        this.reset();
        this.launch();
    }

    flash(txt, dur = 1000) {
        const el = document.getElementById('game-alert');
        el.textContent = txt; el.style.opacity = 1;
        setTimeout(() => el.style.opacity = 0, dur);
    }

    update() {
        if (!this.state.running) return;

        const flavor = CONFIG.FLAVORS[this.state.level];

        // 1. Metabolism & Speed Scaling
        this.state.metabolism = Math.max(0, this.state.metabolism - flavor.drain);
        const speedBoost = (this.state.metabolism / 100) * 1.5;
        this.player.speed = (CONFIG.PLAYER_SPEED * flavor.speedMult) + speedBoost;

        // 2. Player
        const pResult = this.player.update(this.state.buffer);
        if (pResult === 'DOT') {
            this.state.score += CONFIG.SCORE_DOT;
            this.state.metabolism = Math.min(100, this.state.metabolism + 8);
        } else if (pResult === 'POWER') {
            this.state.score += CONFIG.SCORE_POWER;
            this.state.power = CONFIG.POWER_DURATION * flavor.powerMult;
            this.state.metabolism = 100;
        }

        // 3. Ghosts
        for (const g of this.ghosts) {
            const gResult = g.update(this.player, this.state.power, this.state.level);
            if (gResult === 'EATEN') {
                this.state.score += CONFIG.SCORE_GHOST;
                this.state.metabolism = Math.min(100, this.state.metabolism + 25);
                g.reset(g.data.sx, g.data.sy);
                g.spawnTimer = 60;
            } else if (gResult === 'KILL') {
                this.die();
                return;
            }
        }

        // 4. Power
        if (this.state.power > 0) {
            this.state.power--;
            document.getElementById('power-meter').style.opacity = 1;
            document.getElementById('power-bar').style.width = (this.state.power / (CONFIG.POWER_DURATION * flavor.powerMult) * 100) + '%';
        } else {
            document.getElementById('power-meter').style.opacity = 0;
        }

        this.syncHUD();

        // 5. Win
        if (this.maze.countDots() === 0) this.win();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dynamic Radial Light
        const grd = this.ctx.createRadialGradient(
            this.canvas.width/2, this.canvas.height/2, 0, 
            this.canvas.width/2, this.canvas.height/2, 400
        );
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(1, '#f4f7f6');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const f = CONFIG.FLAVORS[this.state.level];
        this.maze.draw(f.color);
        this.player.draw(f.color);
        this.ghosts.forEach(g => g.draw(this.state.power, f.id));
    }

    loop() {
        if (!this.state.running) return;
        this.update();
        this.draw();
        this.state.raf = requestAnimationFrame(() => this.loop());
    }

    syncHUD() {
        document.getElementById('score-val').textContent = this.state.score + 'G';
        if (YoPRO.saveScore('arcade', this.state.score)) {
            this.state.best = this.state.score;
        }
        document.getElementById('best-val').textContent = this.state.best + 'G';
        
        // Update Metabolism Meter
        const metabBar = document.getElementById('metabolism-bar');
        metabBar.style.width = this.state.metabolism + '%';
        
        // Dynamic Glow based on fuel level
        if (this.state.metabolism > 80) {
            metabBar.style.boxShadow = '0 0 25px #2ecc71';
        } else if (this.state.metabolism < 25) {
            metabBar.style.boxShadow = '0 0 15px var(--yopro-red)';
            metabBar.style.background = 'var(--yopro-red)';
        } else {
            metabBar.style.boxShadow = '0 0 15px var(--yopro-green)';
            metabBar.style.background = 'linear-gradient(90deg, var(--yopro-green), #2ecc71)';
        }
    }

    die() {
        this.state.running = false;
        document.getElementById('game-viewport').classList.add('shake');
        setTimeout(() => {
            document.getElementById('game-viewport').classList.remove('shake');
            document.getElementById('final-score').textContent = this.state.score + 'G';
            document.getElementById('overlay-death').classList.add('active');
        }, 500);
    }

    win() {
        this.state.running = false;
        this.state.level = (this.state.level + 1) % CONFIG.FLAVORS.length;
        const f = CONFIG.FLAVORS[this.state.level];

        document.getElementById('next-flavor-tag').textContent = f.name;
        document.getElementById('next-flavor-tag').style.background = f.color;
        document.getElementById('overlay-next').classList.add('active');

        setTimeout(() => {
            document.getElementById('overlay-next').classList.remove('active');
            this.maze.reset(f.maze);
            this.player.reset(9, 15);
            this.ghosts.forEach(g => g.reset(g.data.sx, g.data.sy));
            document.body.className = 'theme-' + f.id;
            document.getElementById('flavor-name').textContent = f.name;
            document.getElementById('level-num').textContent = 'CIRCUIT 0' + (this.state.level + 1);
            this.launch();
        }, 3000);
    }}

// Start
const engine = new GameEngine();
