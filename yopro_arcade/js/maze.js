/**
 * YO PRO ARCADE: PRO EDITION - MAZE ENGINE
 */

class Maze {
    constructor(ctx) {
        this.ctx = ctx;
        this.grid = [];
        this.reset();
    }

    reset(layout) {
        if (!layout) {
            // Default to first flavor if none provided
            this.grid = CONFIG.FLAVORS[0].maze.map(row => [...row]);
        } else {
            this.grid = layout.map(row => [...row]);
        }
    }

    draw(color) {
        const ts = CONFIG.TILE_SIZE;
        for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
                const val = this.grid[y][x];
                const px = x * ts, py = y * ts;

                if (val === 0) {
                    this.drawWall(px, py, color);
                } else if (val === 1) {
                    this.drawDot(px + ts/2, py + ts/2, color);
                } else if (val === 2) {
                    this.drawPower(px + ts/2, py + ts/2, color);
                }
            }
        }
    }

    drawWall(x, y, color) {
        // High-Tech Neon Wall
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = color;
        
        // Outer box
        this.ctx.strokeRect(x + 2, y + 2, 26, 26);
        
        // Inner detail (Circuit feel)
        this.ctx.globalAlpha = 0.3;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 8, y + 8, 14, 14);
        
        // Corner accents
        this.ctx.globalAlpha = 0.8;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x + 12, y + 12, 6, 6);
        
        this.ctx.restore();
    }

    drawDot(x, y, color) {
        // Protein Particle - Now more visible with pulse
        this.ctx.save();
        const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
        const size = 3 + pulse * 2;
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.shadowBlur = 10 + pulse * 10;
        this.ctx.shadowColor = color;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner bright core
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.5 + pulse * 0.5;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawPower(x, y, color) {
        // Glowing Muscle Boost - Extremely visible
        this.ctx.save();
        const time = Date.now();
        const pulse = (Math.sin(time / 200) + 1) / 2;
        const rotate = (time / 500) % (Math.PI * 2);
        
        // Outer glow
        const g = this.ctx.createRadialGradient(x, y, 0, x, y, 20 + pulse * 10);
        g.addColorStop(0, color);
        g.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = g;
        this.ctx.beginPath(); 
        this.ctx.arc(x, y, 22 + pulse * 8, 0, Math.PI * 2); 
        this.ctx.fill();

        // Rotating star/cross
        this.ctx.translate(x, y);
        this.ctx.rotate(rotate);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.shadowBlur = 20; 
        this.ctx.shadowColor = color;
        
        // Draw a diamond shape
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(8, 0);
        this.ctx.lineTo(0, 12);
        this.ctx.lineTo(-8, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Cross symbol for 'Boost'
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(-6, 0); this.ctx.lineTo(6, 0);
        this.ctx.moveTo(0, -6); this.ctx.lineTo(0, 6);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    isWall(gx, gy, isGhost = false) {
        if (gx < 0 || gx >= CONFIG.GRID_WIDTH) return false;
        if (gy < 0 || gy >= CONFIG.GRID_HEIGHT) return false;
        const v = this.grid[gy][gx];
        if (isGhost && v === 4) return false; // Gate
        return v === 0 || v === 4;
    }

    countDots() {
        return this.grid.flat().filter(v => v === 1 || v === 2).length;
    }
}
