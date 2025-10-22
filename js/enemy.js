class Enemy {
    constructor(game) {
        this.game = game;
        this.reset();
        this.particles = [];
    }

    reset() {
        this.x = Math.random() * GameConstants.CANVAS_WIDTH;
        this.y = Math.random() * GameConstants.CANVAS_HEIGHT;
        this.size = GameConstants.ENEMY_SIZE;
        this.speed = GameConstants.DIFFICULTY.medium.enemySpeed;
        this.color = '#ff6b6b';
        this.angle = 0;
        this.rotationSpeed = 0.02;
        this.pulsePhase = 0;
        this.lastDirectionChange = 0;
        this.directionChangeInterval = 120; // frames
    }

    update(player) {
        const playerPos = player.getPosition();
        
        // Change direction occasionally for more natural movement
        this.lastDirectionChange++;
        if (this.lastDirectionChange > this.directionChangeInterval) {
            this.lastDirectionChange = 0;
            // Small random direction change
            this.angle += (Math.random() - 0.5) * 0.5;
        }

        // Main movement towards player with some randomness
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        // Smoothly rotate towards player
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        this.angle += angleDiff * 0.1;

        // Move towards player
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Boundary checking with bounce
        if (this.x < this.size || this.x > GameConstants.CANVAS_WIDTH - this.size) {
            this.angle = Math.PI - this.angle;
            this.x = Utils.clamp(this.x, this.size, GameConstants.CANVAS_WIDTH - this.size);
        }
        if (this.y < this.size || this.y > GameConstants.CANVAS_HEIGHT - this.size) {
            this.angle = -this.angle;
            this.y = Utils.clamp(this.y, this.size, GameConstants.CANVAS_HEIGHT - this.size);
        }

        // Update rotation
        this.rotationSpeed = 0.02 + (this.speed * 0.01);

        // Update pulse effect
        this.pulsePhase += 0.1;

        // Update particles
        this.updateParticles();

        // Create trail particles
        if (Math.random() < 0.3) {
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
        
        // Draw particles
        this.particles.forEach(particle => particle.draw());

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Pulse effect
        const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.scale(pulseScale, pulseScale);

        // Draw enemy body (number 69)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw number 69
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${this.size * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('69', 0, 0);

        // Draw angry eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, -this.size * 0.2, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-this.size * 0.3, -this.size * 0.2, this.size * 0.08, 0, Math.PI * 2);
        ctx.arc(this.size * 0.3, -this.size * 0.2, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Draw angry eyebrows
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.4, -this.size * 0.4);
        ctx.lineTo(-this.size * 0.2, -this.size * 0.35);
        ctx.moveTo(this.size * 0.4, -this.size * 0.4);
        ctx.lineTo(this.size * 0.2, -this.size * 0.35);
        ctx.stroke();

        ctx.restore();

        // Draw detection radius when close to player
        const playerPos = this.game.player.getPosition();
        const distance = Utils.distance(this.x, this.y, playerPos.x, playerPos.y);
        
        if (distance < 200) {
            ctx.save();
            ctx.globalAlpha = 0.2 + (1 - distance / 200) * 0.3;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, 200, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    setDifficulty(difficulty) {
        this.speed = GameConstants.DIFFICULTY[difficulty].enemySpeed;
    }

    checkCollision(player) {
        if (player.isInvulnerable()) return false;

        const playerPos = player.getPosition();
        const distance = Utils.distance(this.x, this.y, playerPos.x, playerPos.y);
        return distance < (this.size + player.getSize()) * 0.8;
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getSize() {
        return this.size;
    }
}
