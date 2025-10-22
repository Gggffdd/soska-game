class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        
        this.gameTime = 0;
        this.difficulty = 'medium';
        this.effects = [];
        this.sounds = {};
        
        this.initializeGame();
        this.setupEventListeners();
        this.startLoading();
    }

    initializeGame() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize game objects
        this.player = new Player(this);
        this.enemy = new Enemy(this);
        this.barrierManager = new BarrierManager(this);

        // Initialize sounds
        this.initializeSounds();

        // Load settings
        this.loadSettings();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Update game constants for responsive design
        GameConstants.CANVAS_WIDTH = this.canvas.width;
        GameConstants.CANVAS_HEIGHT = this.canvas.height;
    }

    initializeSounds() {
        this.sounds = {
            bgMusic: document.getElementById('bgMusic'),
            barrier: document.getElementById('barrierSound'),
            gameOver: document.getElementById('gameOverSound'),
            collect: document.getElementById('collectSound')
        };

        // Create fallback audio elements if needed
        if (!this.sounds.barrier.src) {
            this.sounds.barrier = new Audio();
            this.sounds.barrier.volume = 0.3;
        }
        if (!this.sounds.gameOver.src) {
            this.sounds.gameOver = new Audio();
            this.sounds.gameOver.volume = 0.5;
        }
        if (!this.sounds.collect.src) {
            this.sounds.collect = new Audio();
            this.sounds.collect.volume = 0.4;
        }
    }

    setupEventListeners() {
        // Game control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('statsBtn').addEventListener('click', () => this.showStats());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('barrierBtn').addEventListener('click', () => this.useBarrier());
        document.getElementById('useBarrier').addEventListener('click', () => this.useBarrier());

        // Navigation buttons
        document.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('backFromStats').addEventListener('click', () => this.showMainMenu());
        document.getElementById('resetStats').addEventListener('click', () => this.resetStatistics());

        // Pause screen buttons
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromPause').addEventListener('click', () => this.showMainMenu());

        // Game over screen buttons
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromGameOver').addEventListener('click', () => this.showMainMenu());
        document.getElementById('shareBtn').addEventListener('click', () => this.shareScore());

        // Settings controls
        document.getElementById('soundVolume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = e.target.value + '%';
        });

        document.getElementById('gameDifficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Swipe up for pause (mobile)
        let startY;
        this.canvas.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (startY - e.changedTouches[0].clientY > 100) {
                this.togglePause();
            }
        });
    }

    handleKeyDown(e) {
        if (e.code === 'Escape') {
            this.togglePause();
        }
        if (e.code === 'Space') {
            e.preventDefault();
            this.useBarrier();
        }
    }

    startLoading() {
        // Simulate loading process
        const loadingProgress = document.querySelector('.loading-progress');
        let progress = 0;
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                setTimeout(() => {
                    this.showMainMenu();
                }, 500);
            }
            loadingProgress.style.width = progress + '%';
        }, 100);
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.remove('hidden');
    }

    showMainMenu() {
        this.showScreen('mainMenu');
        this.state.setState(GameState.STATES.MENU);
        this.stopGame();
    }

    showSettings() {
        this.showScreen('settingsScreen');
        this.state.setState(GameState.STATES.SETTINGS);
        this.loadSettingsToUI();
    }

    showStats() {
        this.showScreen('statsScreen');
        this.state.setState(GameState.STATES.STATS);
        this.loadStatistics();
    }

    startGame() {
        this.showScreen('gameScreen');
        this.state.setState(GameState.STATES.PLAYING);
        
        this.resetGame();
        this.gameLoop();
        
        // Start background music if enabled
        if (this.settings.soundEnabled) {
            this.sounds.bgMusic.volume = this.settings.soundVolume / 100;
            this.sounds.bgMusic.play().catch(e => console.log('Music play failed:', e));
        }
    }

    togglePause() {
        if (this.state.is(GameState.STATES.PLAYING)) {
            this.pauseGame();
        } else if (this.state.is(GameState.STATES.PAUSED)) {
            this.resumeGame();
        }
    }

    pauseGame() {
        this.showScreen('pauseScreen');
        this.state.setState(GameState.STATES.PAUSED);
        
        // Update pause screen stats
        document.getElementById('pauseTime').textContent = Utils.formatTime(this.gameTime);
        document.getElementById('pauseBarriers').textContent = this.player.barriers;
        document.getElementById('pauseDistance').textContent = Math.floor(
            Utils.distance(
                this.player.x, this.player.y,
                this.enemy.x, this.enemy.y
            )
        );
    }

    resumeGame() {
        this.showScreen('gameScreen');
        this.state.setState(GameState.STATES.PLAYING);
        this.gameLoop();
    }

    gameOver() {
        this.showScreen('gameOverScreen');
        this.state.setState(GameState.STATES.GAME_OVER);
        
        // Update game over screen
        document.getElementById('finalTime').textContent = Utils.formatTime(this.gameTime);
        document.getElementById('finalBarriers').textContent = this.player.barriers;
        
        // Update best time
        const bestTime = Utils.getStorage('bestTime', 0);
        if (this.gameTime > bestTime) {
            Utils.setStorage('bestTime', this.gameTime);
        }
        document.getElementById('bestTime').textContent = Utils.formatTime(bestTime);
        
        // Update statistics
        this.updateStatistics();
        
        // Play game over sound
        Utils.playSound(this.sounds.gameOver);
        Utils.vibrate([200, 100, 200]);
        
        this.stopGame();
    }

    resetGame() {
        this.gameTime = 0;
        this.effects = [];
        
        this.player.reset();
        this.enemy.reset();
        this.enemy.setDifficulty(this.difficulty);
        this.barrierManager.reset();
        
        this.updateHUD();
    }

    restartGame() {
        this.resetGame();
        this.startGame();
    }

    stopGame() {
        this.sounds.bgMusic.pause();
        this.sounds.bgMusic.currentTime = 0;
    }

    useBarrier() {
        if (this.state.is(GameState.STATES.PLAYING)) {
            if (this.player.useBarrier()) {
                this.updateHUD();
            } else {
                // No barriers available - show warning
                Utils.vibrate([50]);
            }
        }
    }

    updateHUD() {
        document.getElementById('timer').textContent = Utils.formatTime(this.gameTime);
        document.getElementById('barrierCount').textContent = this.player.barriers;
    }

    gameLoop() {
        if (!this.state.is(GameState.STATES.PLAYING)) return;

        // Update game state
        this.update();
        
        // Render game
        this.render();
        
        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Update game time
        this.gameTime += 1/60; // Assuming 60fps
        
        // Update HUD every second
        if (Math.floor(this.gameTime * 60) % 60 === 0) {
            this.updateHUD();
        }

        // Update game objects
        this.player.update();
        this.enemy.update(this.player);
        this.barrierManager.update(this.player);

        // Update effects
        this.updateEffects();

        // Check for game over
        if (this.enemy.checkCollision(this.player)) {
            this.gameOver();
        }

        // Increase difficulty over time
        if (this.gameTime > 30) { // After 30 seconds
            this.enemy.speed = GameConstants.DIFFICULTY[this.difficulty].enemySpeed * (1 + this.gameTime / 120);
        }
    }

    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].update();
            if (this.effects[i].isDead()) {
                this.effects.splice(i, 1);
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid background
        this.drawBackground();

        // Draw game objects
        this.barrierManager.draw();
        this.player.draw();
        this.enemy.draw();

        // Draw effects
        this.effects.forEach(effect => effect.draw(this.ctx));

        // Draw debug info (optional)
        if (this.settings.showDebug) {
            this.drawDebugInfo();
        }
    }

    drawBackground() {
        const ctx = this.ctx;
        const gridSize = 50;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${Math.round(this.fps)}`,
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            `Enemy: (${Math.round(this.enemy.x)}, ${Math.round(this.enemy.y)})`,
            `Barriers: ${this.barrierManager.getBarrierCount()}`,
            `Effects: ${this.effects.length}`,
            `Difficulty: ${this.difficulty}`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 10, 20 + index * 15);
        });
    }

    // Settings management
    loadSettings() {
        this.settings = Utils.getStorage('gameSettings', {
            soundVolume: 50,
            soundEnabled: true,
            vibration: true,
            particles: true,
            difficulty: 'medium',
            showDebug: false
        });
        
        this.difficulty = this.settings.difficulty;
    }

    loadSettingsToUI() {
        document.getElementById('soundVolume').value = this.settings.soundVolume;
        document.getElementById('volumeValue').textContent = this.settings.soundVolume + '%';
        document.getElementById('gameDifficulty').value = this.settings.difficulty;
        document.getElementById('vibration').checked = this.settings.vibration;
        document.getElementById('particles').checked = this.settings.particles;
    }

    saveSettings() {
        this.settings = {
            soundVolume: parseInt(document.getElementById('soundVolume').value),
            soundEnabled: true,
            vibration: document.getElementById('vibration').checked,
            particles: document.getElementById('particles').checked,
            difficulty: document.getElementById('gameDifficulty').value,
            showDebug: false
        };
        
        Utils.setStorage('gameSettings', this.settings);
        this.difficulty = this.settings.difficulty;
        this.enemy.setDifficulty(this.difficulty);
        
        // Apply sound settings
        this.sounds.bgMusic.volume = this.settings.soundVolume / 100;
        
        this.showMainMenu();
    }

    // Statistics management
    loadStatistics() {
        const stats = Utils.getStorage('gameStatistics', {
            bestTime: 0,
            totalGames: 0,
            totalBarriers: 0,
            totalTime: 0
        });
        
        document.getElementById('statBestTime').textContent = Utils.formatTime(stats.bestTime);
        document.getElementById('statTotalGames').textContent = stats.totalGames;
        document.getElementById('statTotalBarriers').textContent = stats.totalBarriers;
        document.getElementById('statTotalTime').textContent = Utils.formatTime(stats.totalTime);
    }

    updateStatistics() {
        const stats = Utils.getStorage('gameStatistics', {
            bestTime: 0,
            totalGames: 0,
            totalBarriers: 0,
            totalTime: 0
        });
        
        stats.totalGames++;
        stats.totalBarriers += this.player.barriers;
        stats.totalTime += this.gameTime;
        
        if (this.gameTime > stats.bestTime) {
            stats.bestTime = this.gameTime;
        }
        
        Utils.setStorage('gameStatistics', stats);
    }

    resetStatistics() {
        const defaultStats = {
            bestTime: 0,
            totalGames: 0,
            totalBarriers: 0,
            totalTime: 0
        };
        
        Utils.setStorage('gameStatistics', defaultStats);
        this.loadStatistics();
    }

    shareScore() {
        const text = `Я играл в Number Chase и продержался ${Utils.formatTime(this.gameTime)}! Сможешь побить мой рекорд?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Number Chase',
                text: text,
                url: window.location.href
            }).catch(() => this.fallbackShare(text));
        } else {
            this.fallbackShare(text);
        }
    }

    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Результат скопирован в буфер обмена!');
            });
        } else {
            prompt('Скопируйте ваш результат:', text);
        }
    }
}

// FPS counter
class FPSCounter {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime >= this.lastTime + 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        return this.fps;
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new Game();
    window.game = game; // For debugging
    
    // Initialize FPS counter
    const fpsCounter = new FPSCounter();
    
    function updateFPS() {
        game.fps = fpsCounter.update();
        requestAnimationFrame(updateFPS);
    }
    updateFPS();
});
