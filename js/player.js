class Player {
    constructor(game) {
        this.game = game;
        this.reset();
        this.setupEventListeners();
    }

    reset() {
        this.x = GameConstants.CANVAS_WIDTH / 2;
        this.y = GameConstants.CANVAS_HEIGHT / 2;
        this.size = GameConstants.PLAYER_SIZE;
        this.color = '#48dbfb';
        this.barriers = 0;
        this.maxBarriers = 3;
        this.isDashing = false;
        this.dashCooldown = 0;
        this.invulnerable = 0;
        this.particles = [];
        
        // Параметры управления
        this.speed = 4;
        this.targetX = this.x;
        this.targetY = this.y;
        this.isMoving = false;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    setupEventListeners() {
        const gameArea = document.getElementById('moveArea');
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let currentDrag = { x: 0, y: 0 };

        // Создаем визуал джойстика
        const joystickBase = document.createElement('div');
        const joystickHandle = document.createElement('div');
        joystickBase.className = 'joystick-base';
        joystickHandle.className = 'joystick-handle';
        joystickBase.appendChild(joystickHandle);
        gameArea.appendChild(joystickBase);

        this.joystickHandle = joystickHandle;

        // Touch события
        gameArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = gameArea.getBoundingClientRect();
            dragStart.x = e.touches[0].clientX - rect.left;
            dragStart.y = e.touches[0].clientY - rect.top;
            currentDrag = { x: 0, y: 0 };
            isDragging = true;
        });

        gameArea.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const rect = gameArea.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const touchY = e.touches[0].clientY - rect.top;
            
            currentDrag.x = touchX - dragStart.x;
            currentDrag.y = touchY - dragStart.y;
            
            const maxRadius = 40;
            const distance = Math.sqrt(currentDrag.x * currentDrag.x + currentDrag.y * currentDrag.y);
            if (distance > maxRadius) {
                currentDrag.x = (currentDrag.x / distance) * maxRadius;
                currentDrag.y = (currentDrag.y / distance) * maxRadius;
            }
            
            this.updateMovement(currentDrag.x, currentDrag.y);
        });

        gameArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDragging = false;
            currentDrag = { x: 0, y: 0 };
            this.isMoving = false;
            this.joystickHandle.style.transform = 'translate(-50%, -50%)';
        });

        // Mouse события
        gameArea.addEventListener('mousedown', (e) => {
            const rect = gameArea.getBoundingClientRect();
            dragStart.x = e.clientX - rect.left;
            dragStart.y = e.clientY - rect.top;
            currentDrag = { x: 0, y: 0 };
            isDragging = true;
        });

        gameArea.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = gameArea.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            currentDrag.x = mouseX - dragStart.x;
            currentDrag.y = mouseY - dragStart.y;
            
            const maxRadius = 40;
            const distance = Math.sqrt(currentDrag.x * currentDrag.x + currentDrag.y * currentDrag.y);
            if (distance > maxRadius) {
                currentDrag.x = (currentDrag.x / distance) * maxRadius;
                currentDrag.y = (currentDrag.y / distance) * maxRadius;
            }
            
            this.updateMovement(currentDrag.x, currentDrag.y);
        });

        gameArea.addEventListener('mouseup', () => {
            isDragging = false;
            currentDrag = { x: 0, y: 0 };
            this.isMoving = false;
            this.joystickHandle.style.transform = 'translate(-50%, -50%)';
        });

        gameArea.addEventListener('mouseleave', () => {
            isDragging = false;
            currentDrag = { x: 0, y: 0 };
            this.isMoving = false;
            this.joystickHandle.style.transform = 'translate(-50%, -50%)';
        });
    }

    updateMovement(dragX, dragY) {
        if (Math.abs(dragX) > 5 || Math.abs(dragY) > 5) {
            this.isMoving = true;
            
            const distance = Math.sqrt(dragX * dragX + dragY * dragY);
            const speedMultiplier = Math.min(distance / 40, 1);
            
            this.velocityX = (dragX / distance) * this.speed * speedMultiplier;
            this.velocityY = (dragY / distance) * this.speed * speedMultiplier;
            
            // Обновляем визуал джойстика
            if (this.joystickHandle) {
                const maxMove = 25;
                const handleX = (dragX / 40) * maxMove;
                const handleY = (dragY / 40) * maxMove;
                this.joystickHandle.style.transform = `translate(calc(-50% + ${handleX}px), calc(-50% + ${handleY}px))`;
            }
        } else {
            this.isMoving = false;
            this.velocityX = 0;
            this.velocityY = 0;
        }
    }

    update() {
        // Движение
        if (this.isMoving) {
            this.x += this.velocityX;
            this.y += this.velocityY;
        }

        // Границы
        this.x = Utils.clamp(this.x, this.size, GameConstants.CANVAS_WIDTH - this.size);
        this.y = Utils.clamp(this.y, this.size, GameConstants.CANVAS_HEIGHT - this.size);

        // Обновление способностей
        if (this.dashCooldown > 0) {
            this.dashCooldown--;
        }

        if (this.invulnerable > 0) {
            this.invulnerable--;
        }

        this.updateParticles();

        // Частицы при движении
        if (this.isMoving && Math.random() < 0.3) {
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

        // Частицы
        this.particles.forEach(particle => particle.draw());

        ctx.save();
        
        if (this.isDashing) {
            const scale = 1 + Math.sin(Date.now() * 0.1) * 0.2;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            ctx.translate(-this.x, -this.y);
        }

        // Тело игрока
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Лицо
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 5, 3, 0, Math.PI);
        ctx.fill();

        // Индикатор неуязвимости
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
        if (this.barriers > 0 && this.invulnerable === 0) {
            this.barriers--;
            this.invulnerable = 90;
            
            for (let i = 0; i < 20; i++) {
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
        if (this.barriers < this.maxBarriers) {
            this.barriers++;
            Utils.playSound(this.game.sounds.collect);
            
            for (let i = 0; i < 10; i++) {
                this.particles.push(Utils.createParticle(
                    this.x, this.y, '#feca57', this.game.ctx
                ));
            }
            return true;
        }
        return false;
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
