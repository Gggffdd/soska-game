class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        
        this.gameTime = 0;
        this.difficulty = 'medium';
        this.effects = [];
        this.sounds = {};
        this.fps = 60;
        
        // Настройки камеры
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.7,
            targetZoom: 0.7
        };
        
        this.initializeGame();
        this.setupEventListeners();
        this.startLoading();
    }

    initializeGame() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.player = new Player(this);
        this.enemy = new Enemy(this);
        this.barrierManager = new BarrierManager(this);

        this.initializeSounds();
        this.loadSettings();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Большой игровой мир
        GameConstants.CANVAS_WIDTH = Math.max(1200, this.canvas.width * 1.5);
        GameConstants.CANVAS_HEIGHT = Math.max(1200, this.canvas.height * 1.5);
    }

    initializeSounds() {
        this.sounds = {
            bgMusic: document.getElementById('bgMusic'),
            barrier: document.getElementById('barrierSound'),
            gameOver: document.getElementById('gameOverSound'),
            collect: document.getElementById('collectSound')
        };

        // Базовые настройки звука
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = 0.5;
            }
        });
    }

    setupEventListeners() {
        // Кнопки меню
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('statsBtn').addEventListener('click', () => this.showStats());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('useBarrier').addEventListener('click', () => this.useBarrier());

        // Навигация
        document.getElementById('backToMenu').addEventListener('click', () => this.showMainMenu());
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('backFromStats').addEventListener('click', () => this.showMainMenu());

        // Пауза
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromPause').addEventListener('click', () => this.showMainMenu());

        // Game Over
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartGame());
        document.getElementById('menuFromGameOver').addEventListener('click', () => this.showMainMenu());

        // Настройки
        document.getElementById('soundVolume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = e.target.value + '%';
        });

        document.getElementById('gameDifficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
        });

        // Клавиатура
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Свайп для паузы
        let startY;
        this.canvas.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (startY - e.changedTouches[0].clientY > 100) {
                this.togglePause();
            }
        });

        // Предотвращение контекстного меню
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
        const loadingProgress = document.querySelector('.loading-progress');
        let progress = 0;
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
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
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
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
        
        // Фоновая музыка
        if (this.settings.soundEnabled) {
            this.sounds.bgMusic.volume = this.settings.soundVolume / 100;
            this.sounds.bgMusic.play().catch(e => console.log('Music auto-play blocked'));
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
        
        document.getElementById('pauseTime').textContent = Utils.formatTime(this.gameTime);
        document.getElementById('pauseBarriers').textContent = this.player.barriers;
    }

    resumeGame() {
        this.showScreen('gameScreen');
        this.state.setState(GameState.STATES.PLAYING);
        this.gameLoop();
    }

    gameOver() {
        this.showScreen('gameOverScreen');
        this.state.setState(GameState.STATES.GAME_OVER);
        
        // Обновление статистики
        document.getElementById('finalTime').textContent = Utils.formatTime(this.gameTime);
        document.getElementById('finalBarriers').textContent = this.player.barriers;
        
        const bestTime = Utils.getStorage('bestTime', 0);
        if (this.gameTime > bestTime) {
            Utils.setStorage('bestTime', this.gameTime);
        }
        document.getElementById('bestTime').textContent = Utils.formatTime(bestTime);
        
        this.updateStatistics();
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
                Utils.vibrate([50]);
            }
        }
    }

    updateHUD() {
        document.getElementById('timer').textContent = Utils.formatTime(this.gameTime);
        
        // Обновление индикаторов здоровья
        const healthIndicators = document.querySelectorAll('.health-indicator');
        healthIndicators.forEach((indicator, index) => {
            if (index < this.player.barriers) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    gameLoop() {
        if (!this.state.is(GameState.STATES.PLAYING)) return;

        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.gameTime += 1/60;

        // Обновление HUD каждую секунду
        if (Math.floor(this.gameTime * 60) % 60 === 0) {
            this.updateHUD();
        }

        this.player.update();
        this.enemy.update(this.player);
        this.barrierManager.update(this.player);
        this.updateEffects();
        this.updateCamera();

        // Проверка столкновения
        if (this.enemy.checkCollision(this.player)) {
            this.gameOver();
        }

        // Увеличение сложности со временем
        if (this.gameTime > 30) {
            const speedMultiplier = 1 + (this.gameTime - 30) / 120;
            this.enemy.speed = GameConstants.DIFFICULTY[this.difficulty].enemySpeed * speedMultiplier;
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

    updateCamera() {
        const playerPos = this.player.getPosition();
        
        // Камера следует за игроком
        this.camera.x = playerPos.x - this.canvas.width / (2 * this.camera.zoom);
        this.camera.y = playerPos.y - this.canvas.height / (2 * this.camera.zoom);
        
        // Ограничение камеры
        const maxX = GameConstants.CANVAS_WIDTH - this.canvas.width / this.camera.zoom;
        const maxY = GameConstants.CANVAS_HEIGHT - this.canvas.height / this.camera.zoom;
        
        this.camera.x = Utils.clamp(this.camera.x, 0, maxX);
        this.camera.y = Utils.clamp(this.camera.y, 0, maxY);
        
        // Плавное изменение зума
        this.camera.zoom = Utils.lerp(this.camera.zoom, this.camera.targetZoom, 0.1);
    }

    render() {
        // Очистка canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        
        // Применение трансформаций камеры
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Отрисовка игрового мира
        this.drawBackground();
        this.barrierManager.draw();
        this.player.draw();
        this.enemy.draw();
        this.effects.forEach(effect => effect.draw(this.ctx));

        this.ctx.restore();
    }

    drawBackground() {
        const ctx = this.ctx;
        const gridSize = 80;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        
        // Вертикальные линии
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const endX = this.camera.x + this.canvas.width / this.camera.zoom;
        
        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, this.camera.y);
            ctx.lineTo(x, this.camera.y + this.canvas.height / this.camera.zoom);
            ctx.stroke();
        }
        
        // Горизонтальные линии
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endY = this.camera.y + this.canvas.height / this.camera.zoom;
        
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(this.camera.x, y);
            ctx.lineTo(this.camera.x + this.canvas.width / this.camera.zoom, y);
            ctx.stroke();
        }
    }

    // Управление настройками
    loadSettings() {
        this.settings = Utils.getStorage('gameSettings', {
            soundVolume: 50,
            soundEnabled: true,
            vibration: true,
            difficulty: 'medium'
        });
        
        this.difficulty = this.settings.difficulty;
    }

    loadSettingsToUI() {
        document.getElementById('soundVolume').value = this.settings.soundVolume;
        document.getElementById('volumeValue').textContent = this.settings.soundVolume + '%';
        document.getElementById('gameDifficulty').value = this.settings.difficulty;
        document.getElementById('vibration').checked = this.settings.vibration;
    }

    saveSettings() {
        this.settings = {
            soundVolume: parseInt(document.getElementById('soundVolume').value),
            soundEnabled: true,
            vibration: document.getElementById('vibration').checked,
            difficulty: document.getElementById('gameDifficulty').value
        };
        
        Utils.setStorage('gameSettings', this.settings);
        this.difficulty = this.settings.difficulty;
        this.enemy.setDifficulty(this.difficulty);
        
        // Применение настроек звука
        this.sounds.bgMusic.volume = this.settings.soundVolume / 100;
        
        this.showMainMenu();
    }

    // Статистика
    loadStatistics() {
        const stats = Utils.getStorage('gameStatistics', {
            bestTime: 0,
            totalGames: 0,
            totalBarriers: 0
        });
        
        document.getElementById('statBestTime').textContent = Utils.formatTime(stats.bestTime);
        document.getElementById('statTotalGames').textContent = stats.totalGames;
        document.getElementById('statTotalBarriers').textContent = stats.totalBarriers;
    }

    updateStatistics() {
        const stats = Utils.getStorage('gameStatistics', {
            bestTime: 0,
            totalGames: 0,
            totalBarriers: 0
        });
        
        stats.totalGames++;
        stats.totalBarriers += this.player.barriers;
        
        if (this.gameTime > stats.bestTime) {
            stats.bestTime = this.gameTime;
        }
        
        Utils.setStorage('gameStatistics', stats);
    }
}

// Инициализация игры
window.addEventListener('load', () => {
    const game = new Game();
    window.game = game;
});
