class BarrierManager {
    constructor(game) {
        this.game = game;
        this.barriers = [];
        this.spawnTimer = 0;
        this.spawnInterval = 120;
        this.maxBarriers = 8;
    }

    reset() {
        this.barriers = [];
        this.spawnTimer = 0;
    }

    update(player) {
        // Спавн новых барьеров
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval && this.barriers.length < this.maxBarriers) {
            if (Math.random() < GameConstants.DIFFICULTY[this.game.difficulty].barrierSpawn) {
                this.spawnBarrier();
            }
            this.spawnTimer = 0;
        }

        // Проверка сбора барьеров
        for (let i = this.barriers.length - 1; i >= 0; i--) {
            const barrier = this.barriers[i];
            
            // Анимация
            barrier.rotation += barrier.rotationSpeed;
            barrier.pulsePhase += 0.05;
            
            // Проверка сбора
            const playerPos = player.getPosition();
            const distance = Utils.distance(barrier.x, barrier.y, playerPos.x, playerPos.y);
            
            if (distance < GameConstants.COLLECTION_RADIUS) {
                if (player.addBarrier()) {
                    this.createCollectionEffect(barrier.x, barrier.y);
                    this.barriers.splice(i, 1);
                    this.game.updateHUD();
                }
            }
        }
    }

    spawnBarrier() {
        // Позиция вдали от игрока и врага
        let validPosition = false;
        let attempts = 0;
        let x, y;

        while (!validPosition && attempts < 20) {
            x = Utils.random(GameConstants.BARRIER_SIZE, GameConstants.CANVAS_WIDTH - GameConstants.BARRIER_SIZE);
            y = Utils.random(GameConstants.BARRIER_SIZE, GameConstants.CANVAS_HEIGHT - GameConstants.BARRIER_SIZE);
            
            const playerPos = this.game.player.getPosition();
            const enemyPos = this.game.enemy.getPosition();
            
            const distToPlayer = Utils.distance(x, y, playerPos.x, playerPos.y);
            const distToEnemy = Utils.distance(x, y, enemyPos.x, enemyPos.y);
            
            if (distToPlayer > 150 && distToEnemy > 150) {
                validPosition = true;
            }
            attempts++;
        }

        if (validPosition) {
            const barrier = {
                x: x,
                y: y,
                size: GameConstants.BARRIER_SIZE,
                rotation: 0,
                rotationSpeed: Utils.random(-0.03, 0.03),
                pulsePhase: Math.random() * Math.PI * 2,
                color: '#feca57'
            };
            
            this.barriers.push(barrier);
            this.createSpawnEffect(barrier.x, barrier.y);
        }
    }

    createSpawnEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * 2,
                vy: Math.sin(angle) * 2,
                life: 1,
                maxLife: 1,
                color: '#feca57',
                size: Utils.random(2, 4),
                update: function() {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.04;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
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
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(1, 4);
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: Utils.random(0.8, 1.2),
                color: '#feca57',
                size: Utils.random(1, 3),
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

    draw() {
        const ctx = this.game.ctx;
        
        this.barriers.forEach(barrier => {
            ctx.save();
            ctx.translate(barrier.x, barrier.y);
            ctx.rotate(barrier.rotation);

            // Пульсация
            const pulseScale = 1 + Math.sin(barrier.pulsePhase) * 0.15;
            ctx.scale(pulseScale, pulseScale);

            // Внешний круг
            ctx.strokeStyle = barrier.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, barrier.size, 0, Math.PI * 2);
            ctx.stroke();

            // Иконка щита
            ctx.fillStyle = barrier.color;
            ctx.beginPath();
            ctx.moveTo(0, -barrier.size * 0.5);
            ctx.lineTo(barrier.size * 0.3, -barrier.size * 0.2);
            ctx.lineTo(barrier.size * 0.3, barrier.size * 0.3);
            ctx.lineTo(-barrier.size * 0.3, barrier.size * 0.3);
            ctx.lineTo(-barrier.size * 0.3, -barrier.size * 0.2);
            ctx.closePath();
            ctx.fill();

            // Внутренние детали
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -barrier.size * 0.25);
            ctx.lineTo(barrier.size * 0.15, 0);
            ctx.lineTo(0, barrier.size * 0.25);
            ctx.lineTo(-barrier.size * 0.15, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        });
    }

    getBarrierCount() {
        return this.barriers.length;
    }
}
