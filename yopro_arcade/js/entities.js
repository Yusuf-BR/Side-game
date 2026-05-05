/**
 * YO PRO ARCADE: PRO EDITION - ENTITIES
 * FINAL "EASY-GLIDE" PHYSICS ENGINE
 */

class BaseActor {
    constructor(gx, gy, speed, maze) {
        this.maze = maze;
        this.speed = speed;
        this.tileSize = 30;
        this.reset(gx, gy);
    }

    reset(gx, gy) {
        this.gx = gx;
        this.gy = gy;
        this.x = gx * this.tileSize + this.tileSize / 2;
        this.y = gy * this.tileSize + this.tileSize / 2;
        this.dir = { x: 0, y: 0, id: 'NONE' };
    }

    isWall(gx, gy, isGhost = false) {
        return this.maze.isWall(gx, gy, isGhost);
    }

    // "Easy-Glide" Movement Engine
    moveActor(targetDir, isGhost = false) {
        const cx = this.gx * this.tileSize + this.tileSize / 2;
        const cy = this.gy * this.tileSize + this.tileSize / 2;

        // 1. Instant Reversal (always allowed for player)
        if (!isGhost && targetDir.id !== 'NONE' && targetDir.x === -this.dir.x && targetDir.y === -this.dir.y) {
            this.dir = targetDir;
        }

        // 2. Center-Snapping Turn Logic
        const turnRadius = 10;
        const nearCenter = Math.abs(this.x - cx) < turnRadius && Math.abs(this.y - cy) < turnRadius;

        if (targetDir.id !== 'NONE' && nearCenter) {
            if (!this.isWall(this.gx + targetDir.x, this.gy + targetDir.y, isGhost)) {
                if (targetDir.id !== this.dir.id) {
                    this.x = cx;
                    this.y = cy;
                }
                this.dir = targetDir;
            }
        }

        // 3. Automated Wall Stopping
        if (this.dir.id !== 'NONE') {
            const nextX = this.gx + this.dir.x;
            const nextY = this.gy + this.dir.y;
            
            if (this.isWall(nextX, nextY, isGhost)) {
                const distToCenter = Math.hypot(this.x - cx, this.y - cy);
                if (distToCenter <= this.speed) {
                    this.dir = { x: 0, y: 0, id: 'NONE' };
                    this.x = cx;
                    this.y = cy;
                }
            }
        }

        // 4. Update Position & Wrap
        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;

        const maxW = CONFIG.GRID_WIDTH * this.tileSize;
        if (this.x < 0) this.x = maxW - this.speed;
        if (this.x >= maxW) this.x = 0;

        this.gx = Math.floor(this.x / this.tileSize);
        this.gy = Math.floor(this.y / this.tileSize);
    }
}

class Player extends BaseActor {
    constructor(ctx, maze) {
        super(9, 15, CONFIG.PLAYER_SPEED, maze);
        this.ctx = ctx;
        this.frame = 0;
        this.facing = CONFIG.DIRS.RIGHT;
        this.hDir = 1; // Horizontal direction: 1 for Right, -1 for Left
    }

    update(buffer) {
        this.moveActor(buffer, false);

        if (this.dir.id !== 'NONE') {
            this.facing = this.dir;
            if (this.dir.x !== 0) this.hDir = this.dir.x;
            this.frame += 0.15;
        }

        const val = this.maze.grid[this.gy][this.gx];
        if (val === 1) { 
            this.maze.grid[this.gy][this.gx] = 3; 
            return 'DOT'; 
        }
        if (val === 2) { 
            this.maze.grid[this.gy][this.gx] = 3; 
            return 'POWER'; 
        }
        return null;
    }

    draw(color) {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);

        // Scale and Flip based on direction
        const s = 0.25;
        this.ctx.scale(s * this.hDir, s);

        // Adjust for athlete coordinates (center at 30, 50)
        this.ctx.translate(-30, -50);

        this.drawAthlete(0, 0, color);
        
        this.ctx.restore();
    }

    drawAthlete(x, y, primaryColor) {
        this.ctx.save();
        this.ctx.translate(x, y);

        const primary = primaryColor;
        const skin = '#ffdbac';
        
        const phase = this.frame;
        let legFrontAngle, legBackAngle, armFrontAngle, armBackAngle, bodyTilt, verticalBob;

        // Running animation logic simplified for maze
        legFrontAngle = Math.sin(phase) * 0.7;
        legBackAngle = Math.sin(phase + Math.PI) * 0.7;
        armFrontAngle = Math.sin(phase) * 0.9;
        armBackAngle = Math.sin(phase + Math.PI) * 0.9;
        bodyTilt = 0.15 + Math.sin(phase) * 0.05;
        verticalBob = Math.sin(phase * 2) * 4;

        this.ctx.translate(30, 50 + verticalBob);
        this.ctx.rotate(bodyTilt);
        this.ctx.translate(-30, -50);

        this.drawMuscleLeg(25, 65, legBackAngle, skin, primary);
        this.drawMuscleArm(20, 25, armBackAngle, skin, primary);

        this.ctx.fillStyle = primary;
        this.ctx.beginPath();
        this.ctx.moveTo(10, 15); this.ctx.lineTo(50, 15); this.ctx.lineTo(45, 65); this.ctx.lineTo(15, 65);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = skin;
        this.ctx.beginPath(); this.ctx.arc(35, 0, 14, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#0a3d2d';
        this.ctx.beginPath(); this.ctx.arc(35, -2, 14, Math.PI, 0); this.ctx.fill();

        this.drawMuscleLeg(35, 65, legFrontAngle, skin, primary);
        this.drawMuscleArm(40, 25, armFrontAngle, skin, primary);

        this.ctx.restore();
    }

    drawMuscleArm(x, y, angle, skinColor, clothColor) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.fillStyle = clothColor;
        this.ctx.beginPath(); this.ctx.ellipse(0, 0, 8, 10, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = skinColor;
        this.ctx.beginPath(); this.ctx.ellipse(0, 12, 7, 14, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.translate(0, 22);
        const elbowRotation = -0.8 + angle * 0.5;
        this.ctx.rotate(elbowRotation);
        this.ctx.beginPath(); this.ctx.ellipse(0, 10, 5.5, 11, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(0, 20, 6, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.restore();
    }

    drawMuscleLeg(x, y, angle, skinColor, clothColor) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.fillStyle = clothColor; 
        this.ctx.beginPath(); this.ctx.ellipse(0, 15, 10, 22, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.translate(0, 32);
        const kneeBend = Math.max(0, angle * 0.8);
        this.ctx.rotate(kneeBend);
        this.ctx.fillStyle = skinColor;
        this.ctx.beginPath(); this.ctx.ellipse(0, 12, 8, 15, 0, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.fillStyle = '#111'; this.ctx.fillRect(-9, 24, 20, 10);
        this.ctx.restore();
    }
}

class Ghost extends BaseActor {
    constructor(ctx, maze, data) {
        super(data.sx, data.sy, CONFIG.GHOST_SPEED, maze);
        this.ctx = ctx;
        this.data = data;
        this.spawnTimer = Math.random() * 180;
        this.wiggle = 0;
        this.bottleImages = {};
        this.loadBottles();
    }

    loadBottles() {
        CONFIG.FLAVORS.forEach(f => {
            const img = new Image();
            img.src = f.img;
            this.bottleImages[f.id] = img;
        });
    }

    update(player, power, level) {
        if (this.spawnTimer > 0) { this.spawnTimer--; return null; }

        // Increase difficulty in later levels with higher base speed
        const levelBonus = level > 0 ? (level * 0.3) : 0;
        const s = power > 0 ? CONFIG.FRIGHTENED_SPEED : CONFIG.GHOST_SPEED + levelBonus;
        this.speed = s;
        this.wiggle += 0.2;
        
        const cx = this.gx * 30 + 15;
        const cy = this.gy * 30 + 15;
        
        if (Math.abs(this.x - cx) < this.speed && Math.abs(this.y - cy) < this.speed) {
            this.x = cx; this.y = cy;
            
            // Chasing logic: Nature level is 0.8 accuracy, later levels are 0.95 accuracy
            const accuracy = level === 0 ? 0.8 : 0.95;
            
            let target = { gx: player.gx, gy: player.gy };
            if (power > 0) {
                // Run to corners when player is powered up
                const corners = [{gx: 1, gy: 1}, {gx: 17, gy: 1}, {gx: 1, gy: 19}, {gx: 17, gy: 19}];
                target = corners[this.data.sx % 4]; 
            }

            const ds = [CONFIG.DIRS.UP, CONFIG.DIRS.DOWN, CONFIG.DIRS.LEFT, CONFIG.DIRS.RIGHT].filter(d => {
                if (d.x === -this.dir.x && d.y === -this.dir.y) return false;
                return !this.isWall(this.gx + d.x, this.gy + d.y, true);
            });

            if (ds.length) {
                ds.sort((a,b) => Math.hypot(this.gx+a.x - target.gx, this.gy+a.y - target.gy) - Math.hypot(this.gx+b.x - target.gx, this.gy+b.y - target.gy));
                this.dir = Math.random() < accuracy ? ds[0] : ds[Math.floor(Math.random() * ds.length)];
            } else this.dir = { x: -this.dir.x, y: -this.dir.y };
        }

        this.x += this.dir.x * this.speed;
        this.y += this.dir.y * this.speed;
        this.gx = Math.floor(this.x / 30);
        this.gy = Math.floor(this.y / 30);

        if (Math.hypot(this.x - player.x, this.y - player.y) < 22) return power > 0 ? 'EATEN' : 'KILL';
        return null;
    }

    draw(power, flavorId) {
        this.ctx.save();
        this.ctx.translate(this.x, this.y + Math.sin(this.wiggle) * 3);
        
        if (power > 0) {
            // Transform into YoPRO Bottle
            const img = this.bottleImages[flavorId];
            if (img && img.complete) {
                const pulse = 1 + Math.sin(this.wiggle) * 0.1;
                this.ctx.scale(pulse, pulse);
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = '#1D9E75';
                this.ctx.drawImage(img, -22.5, -25, 45, 50);
            } else {
                this.ctx.fillStyle = '#1D9E75';
                this.ctx.beginPath(); 
                this.ctx.arc(0, 0, 15, 0, Math.PI * 2); 
                this.ctx.fill();
            }
        } else {
            // Normal Aura State
            this.ctx.shadowBlur = 20; 
            this.ctx.shadowColor = this.data.color;
            
            // Subtle colored ring
            this.ctx.strokeStyle = this.data.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1.0;
            this.ctx.font = '32px Arial'; 
            this.ctx.textAlign = 'center'; 
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.data.emoji, 0, 0);
        }
        this.ctx.restore();
    }
}
