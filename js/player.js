class Player {
    constructor(game) {
        this.game = game;
        this.reset();
        
        // Mobile controls
        this.touchStart = { x: 0, y: 0 };
        this.isTouching = false;
        this.velocity = { x: 0, y: 0 };
        this.friction = 0.9;
        this.maxSpeed = 5;
        
        this.setupEventListeners();
    }

    reset() {
        this.x = GameConstants.CANVAS_WIDTH / 2;
        this.y = GameConstants.CANVAS_HEIGHT / 2;
        this.size = GameConstants.PLAYER_SIZE;
        this.color = '#48dbfb';
        this.barriers = 0;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.invulnerable = 0;
        this.particles = [];
    }

    setupEventListeners() {
        // Mouse/touch movement
        this.game.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.game.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.game.canvas.addEventListener('mouseup', () => this.handleEnd());
        
        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        
        this.game.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        
        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        });

        // Double tap for dash
        let lastTap = 0;
        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 500 && tapLength > 0) {
                this.activateDash();
            }
            lastTap = currentTime;
        });

        // Dash button
        document.getElementById('dash').addEventListener('click', () => {
            this.activateDash();
        });
    }

    handleStart(event) {
        const rect = this.game.canvas.getBoundingClientRect();
        this.touchStart.x = event.clientX - rect.left;
        this.touchStart.y = event.clientY - rect.top;
        this.isTouching = true;
    }

    handleMove(event) {
        if (!this.isTouching) return;

        const rect = this.game.canvas.getBoundingClientRect();
        const touchX = event.clientX - rect.left;
        const touchY = event.clientY - rect.top;

        // Calculate direction vector
        const dx = touchX - this.touchStart.x;
        const dy = touchY - this.touchStart.y;
        
        // Normalize and scale velocity
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
            this.velocity.x = (dx / distance) * this.maxSpeed;
            this.velocity.y = (dy / distance) * this.maxSpeed;
        }

        // Update touch start for smooth movement
        this.touchStart.x = touchX;
        this.touchStart.y = touchY;
    }

    handleEnd() {
        this.isTouching = false;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    activateDash() {
        if (this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashCooldown = 60; // 1 second at 60fps
            this.maxSpeed = 10;
            this.invulnerable = 30;
            
            // Dash particles
            for (let i = 0; i < 20; i++) {
                this.particles.push(Utils.createParticle(
                    this.x, this.y, '#48dbfb', this.game.ctx
                ));
            }
            
            Utils.vibrate([100]);
            Utils.playSound(this.game.sounds.dash);
        }
    }

    update() {
        // Apply friction
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Boundary checking
        this.x = Utils.clamp(this.x, this.size, GameConstants.CANVAS_WIDTH - this.size);
        this.y = Utils.clamp(this.y, this.size, GameConstants.CANVAS_HEIGHT - this.size);

        // Update dash cooldown
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
            
            if (this.dashCooldown <= 30 && this.isDashing) {
                this.isDashing = false;
                this.maxSpeed = 5;
            }
        }

        // Update invulnerability
        if (this.invulnerable > 0) {
            this.invulnerable--;
        }

        // Update particles
        this.updateParticles();

        // Create movement particles
        if ((Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) && Math.random() < 0.3) {
            this.particles.push(Utils.createParticle(
                this.x, this.y, '#48dbfb', this.game.ctx
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

        // Draw player with pulsing effect when dashing
        ctx.save();
        
        if (this.isDashing) {
            const scale = 1 + Math.sin(Date.now() * 0.1) * 0.2;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
        }

        // Draw main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw face
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 4, 0, Math.PI * 2); // Left eye
        ctx.arc(this.x + 5, this.y - 3, 4, 0, Math.PI * 2); // Right eye
        ctx.fill();

        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 5, 3, 0, Math.PI); // Smile
        ctx.fill();

        // Draw dash cooldown indicator
        if (this.dashCooldown > 0) {
            const cooldownPercent = this.dashCooldown / 60;
            ctx.strokeStyle = '#feca57';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * (1 - cooldownPercent)));
            ctx.stroke();
        }

        // Draw invulnerability effect
        if (this.invulnerable > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() * 0.1) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    useBarrier() {
        if (this.barriers > 0) {
            this.barriers--;
            this.invulnerable = 90; // 1.5 seconds at 60fps
            
            // Barrier activation effect
            for (let i = 0; i < 30; i++) {
                this.particles.push(Utils.createParticle(
                    this.x, this.y, '#feca57', this.game.ctx
                ));
            }
            
            Utils.vibrate([50, 50, 50]);
            Utils.playSound(this.game.sounds.barrier);
            return true;
        }
        return false;
    }

    addBarrier() {
        this.barriers++;
        Utils.playSound(this.game.sounds.collect);
        
        // Collection effect
        for (let i = 0; i < 15; i++) {
            this.particles.push(Utils.createParticle(
                this.x, this.y, '#feca57', this.game.ctx
            ));
        }
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getSize() {
        return this.size;
    }

    isInvulnerable() {
        return this.invulnerable > 0;
    }
}
