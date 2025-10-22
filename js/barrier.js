class BarrierManager {
    constructor(game) {
        this.game = game;
        this.barriers = [];
        this.spawnTimer = 0;
        this.spawnInterval = 180; // 3 seconds at 60fps
        this.maxBarriers = 10;
    }

    reset() {
        this.barriers = [];
        this.spawnTimer = 0;
    }

    update(player) {
        // Spawn new barriers
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.barriers.length < this.maxBarriers) {
            if (Math.random() < GameConstants.DIFFICULTY[this.game.difficulty].barrierSpawn) {
                this.spawnBarrier();
            }
            this.spawnTimer = 0;
        }

        // Check collection
        for (let i = this.barriers.length - 1; i >= 0; i--) {
            const barrier = this.barriers[i];
            
            // Update animation
            barrier.rotation += barrier.rotationSpeed;
            barrier.pulsePhase += 0.05;
            
            // Check if player collected barrier
            const playerPos = player.getPosition();
            const distance = Utils.distance(barrier.x, barrier.y, playerPos.x, playerPos.y);
            
            if (distance < GameConstants.COLLECTION_RADIUS) {
                player.addBarrier();
                this.createCollectionEffect(barrier.x, barrier.y);
                this.barriers.splice(i, 1);
                
                // Update HUD
                this.game.updateHUD();
            }
        }
    }

    spawnBarrier() {
        const barrier = {
            x: Utils.random(GameConstants.BARRIER_SIZE, GameConstants.CANVAS_WIDTH - GameConstants.BARRIER_SIZE),
            y: Utils.random(GameConstants.BARRIER_SIZE, GameConstants.CANVAS_HEIGHT - GameConstants.BARRIER_SIZE),
            size: GameConstants.BARRIER_SIZE,
            rotation: 0,
            rotationSpeed: Utils.random(-0.05, 0.05),
            pulsePhase: Math.random() * Math.PI * 2,
            color: '#feca57'
        };
        
        // Make sure barrier doesn't spawn too close to player or enemy
        const playerPos = this.game.player.getPosition();
        const enemyPos = this.game.enemy.getPosition();
        
        const distToPlayer = Utils.distance(barrier.x, barrier.y, playerPos.x, playerPos.y);
        const distToEnemy = Utils.distance(barrier.x, barrier.y, enemyPos.x, enemyPos.y);
        
        if (distToPlayer > 100 && distToEnemy > 100) {
            this.barriers.push(barrier);
            this.createSpawnEffect(barrier.x, barrier.y);
        }
    }

    createSpawnEffect(x, y) {
        // Spawn animation particles
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                life: 1,
                maxLife: 1,
                color: '#feca57',
                size: Utils.random(3, 6),
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.03;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },
                draw: function(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                },
                isDead: function() {
                    return this.life <= 0;
                }
            };
            this.game.effects.push(particle);
        }
    }

    createCollectionEffect(x, y) {
        // Collection animation particles
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(2, 6);
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: Utils.random(0.8, 1.5),
                color: '#feca57',
                size: Utils.random(2, 4),
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.02;
                    this.vx *= 0.98;
                    this.vy *= 0.98;
                },
                draw: function(ctx) {
                    const alpha = this.life / this.maxLife;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                },
                isDead: function() {
                    return this.life <= 0;
                }
            };
            this.game.effects.push(particle);
        }
    }

    draw() {
        const ctx = this.game.ctx;
        
        this.barriers.forEach(barrier => {
            ctx.save();
            ctx.translate(barrier.x, barrier.y);
            ctx.rotate(barrier.rotation);

            // Pulse effect
            const pulseScale = 1 + Math.sin(barrier.pulsePhase) * 0.2;
            ctx.scale(pulseScale, pulseScale);

            // Draw barrier outer circle
            ctx.strokeStyle = barrier.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, barrier.size, 0, Math.PI * 2);
            ctx.stroke();

            // Draw shield icon
            ctx.fillStyle = barrier.color;
            ctx.beginPath();
            ctx.moveTo(0, -barrier.size * 0.6);
            ctx.lineTo(barrier.size * 0.4, -barrier.size * 0.2);
            ctx.lineTo(barrier.size * 0.4, barrier.size * 0.4);
            ctx.lineTo(-barrier.size * 0.4, barrier.size * 0.4);
            ctx.lineTo(-barrier.size * 0.4, -barrier.size * 0.2);
            ctx.closePath();
            ctx.fill();

            // Draw inner details
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -barrier.size * 0.3);
            ctx.lineTo(barrier.size * 0.2, 0);
            ctx.lineTo(0, barrier.size * 0.3);
            ctx.lineTo(-barrier.size * 0.2, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();

            // Draw collection radius when player is close
            const playerPos = this.game.player.getPosition();
            const distance = Utils.distance(barrier.x, barrier.y, playerPos.x, playerPos.y);
            
            if (distance < 100) {
                ctx.save();
                ctx.globalAlpha = 0.1 + (1 - distance / 100) * 0.2;
                ctx.strokeStyle = '#feca57';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.arc(barrier.x, barrier.y, GameConstants.COLLECTION_RADIUS, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    getBarrierCount() {
        return this.barriers.length;
    }

    getTotalBarriers() {
        return this.barriers.length;
    }
}
