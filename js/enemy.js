class Enemy {
    constructor(game) {
        this.game = game;
        this.reset();
        this.particles = [];
    }

    reset() {
        // Стартовая позиция подальше от игрока
        const angle = Math.random() * Math.PI * 2;
        const distance = 300;
        this.x = GameConstants.CANVAS_WIDTH / 2 + Math.cos(angle) * distance;
        this.y = GameConstants.CANVAS_HEIGHT / 2 + Math.sin(angle) * distance;
        this.size = GameConstants.ENEMY_SIZE;
        this.speed = GameConstants.DIFFICULTY.medium.enemySpeed;
        this.color = '#ff6b6b';
        this.angle = 0;
        this.rotationSpeed = 0.02;
        this.pulsePhase = 0;
        this.lastDirectionChange = 0;
        this.directionChangeInterval = 90;
    }

    update(player) {
        const playerPos = player.getPosition();
        
        // Плавное преследование
        this.lastDirectionChange++;
        if (this.lastDirectionChange > this.directionChangeInterval) {
            this.lastDirectionChange = 0;
            this.angle += (Math.random() - 0.5) * 0.2;
        }

        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dy, dx);
        
        // Плавный поворот
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.angle += angleDiff * 0.08;

        // Движение к игроку
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Границы с отскоком
        const margin = this.size;
        if (this.x < margin || this.x > GameConstants.CANVAS_WIDTH - margin) {
            this.angle = Math.PI - this.angle;
            this.x = Utils.clamp(this.x, margin, GameConstants.CANVAS_WIDTH - margin);
        }
        if (this.y < margin || this.y > GameConstants.CANVAS_HEIGHT - margin) {
            this.angle = -this.angle;
            this.y = Utils.clamp(this.y, margin, GameConstants.CANVAS_HEIGHT - margin);
        }

        // Анимации
        this.rotationSpeed = 0.02 + (this.speed * 0.01);
        this.pulsePhase += 0.1;
        this.updateParticles();

        // Частицы
        if (Math.random() < 0.2) {
            this.particles.push(Utils.createParticle(
                this.x, this.y, '#ff6b6b', this.game.ctx
            ));
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.game.ctx;
        
        // Частицы
        this.particles.forEach(particle => particle.draw());

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Пульсация
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.scale(pulseScale, pulseScale);

        // Тело врага
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Число 69
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${this.size * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('69', 0, 0);

        // Глаза
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-this.size * 0.25, -this.size * 0.15, this.size * 0.12, 0, Math.PI * 2);
        ctx.arc(this.size * 0.25, -this.size * 0.15, this.size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-this.size * 0.25, -this.size * 0.15, this.size * 0.06, 0, Math.PI * 2);
        ctx.arc(this.size * 0.25, -this.size * 0.15, this.size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Брови
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.35, -this.size * 0.3);
        ctx.lineTo(-this.size * 0.15, -this.size * 0.25);
        ctx.moveTo(this.size * 0.35, -this.size * 0.3);
        ctx.lineTo(this.size * 0.15, -this.size * 0.25);
        ctx.stroke();

        ctx.restore();
    }

    setDifficulty(difficulty) {
        this.speed = GameConstants.DIFFICULTY[difficulty].enemySpeed;
    }

    checkCollision(player) {
        if (player.isInvulnerable()) return false;

        const playerPos = player.getPosition();
        const distance = Utils.distance(this.x, this.y, playerPos.x, playerPos.y);
        
        // Точное столкновение - должны коснуться
        const collisionDistance = (this.size * 0.8) + (player.getSize() * 0.8);
        return distance < collisionDistance;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getSize() {
        return this.size;
    }
}
