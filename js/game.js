class Game {
    constructor() {
        console.log('Game constructor called');
        
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas not found!');
            this.showErrorScreen('Canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        
        this.gameTime = 0;
        this.difficulty = 'medium';
        this.effects = [];
        this.sounds = {};
        this.isInitialized = false;
        
        // Настройки камеры
        this.camera = {
            x: 0,
            y: 0,
            zoom: 0.7
        };
        
        try {
            this.initializeGame();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showErrorScreen('Initialization failed: ' + error.message);
        }
    }

    showErrorScreen(message) {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div style="text-align: center; color: white;">
                    <h1>ERROR</h1>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #ff6b6b; border: none; border-radius: 5px; color: white; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    initializeGame() {
        console.log('Initializing game components...');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Инициализация игровых объектов
        this.player = new Player(this);
        this.enemy = new Enemy(this);
        this.barrierManager = new BarrierManager(this);

        this.initializeSounds();
        this.loadSettings();
        
        // Принудительный переход к меню через 3 секунды максимум
        setTimeout(() => {
            if (document.getElementById('loadingScreen') && 
                !document.getElementById('loadingScreen').classList.contains('hidden')) {
                this.showMainMenu();
            }
        }, 3000);
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Устанавливаем размеры с учетом DPI
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Масштабируем контекст
        this.ctx.scale(dpr, dpr);
        
        // Большой игровой мир
        GameConstants.CANVAS_WIDTH = Math.max(1200, width * 1.5);
        GameConstants.CANVAS_HEIGHT = Math.max(1200, height * 1.5);
        
        console.log('Canvas resized to:', width, height);
    }

    initializeSounds() {
        this.sounds = {
            bgMusic: document.getElementById('bgMusic'),
            barrier: document.getElementById('barrierSound'),
            gameOver: document.getElementById('gameOverSound'),
            collect: document.getElementById('collectSound')
        };

        // Настройка звуков
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = 0.5;
                sound.preload = 'auto';
            }
        });
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Основные кнопки меню
        this.setupButton('startBtn', () => this.startGame());
        this.setupButton('settingsBtn', () => this.showSettings());
        this.setupButton('pauseBtn', () => this.togglePause());
        this.setupButton('useBarrier', () => this.useBarrier());
        
        // Кнопки навигации
        this.setupButton('resumeBtn', () => this.resumeGame());
        this.setupButton('menuFromPause', () => this.showMainMenu());
        this.setupButton('playAgainBtn', () => this.restartGame());
        this.setupButton('menuFromGameOver', () => this.showMainMenu());
        this.setupButton('backToMenu', () => this.showMainMenu());
        this.setupButton('saveSettings', () => this.saveSettings());
        this.setupButton('statsBtn', () => this.showStats());
        this.setupButton('backFromStats', () => this.showMainMenu());

        // Настройки
        const soundVolume = document.getElementById('soundVolume');
        const gameDifficulty = document.getElementById('gameDifficulty');
        
        if (soundVolume) {
            soundVolume.addEventListener('input', (e) => {
                document.getElementById('volumeValue').textContent = e.target.value + '%';
            });
        }
        
        if (gameDifficulty) {
            gameDifficulty.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
            });
        }

        // Клавиатура
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Touch события для паузы
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
        
        console.log('Event listeners setup complete');
    }

    setupButton(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        } else {
            console.warn('Button not found:', id);
        }
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

    showScreen(screenId) {
        try {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.add('hidden');
            });
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.remove('hidden');
            } else {
                console.error('Screen not found:', screenId);
            }
        } catch (error) {
            console.error('Error showing screen:', error);
        }
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
        if (!this.isInitialized) {
            console.error('Game not initialized');
            return;
        }
        
        console.log('Starting game...');
        this.showScreen('gameScreen');
        this.state.setState(GameState.STATES.PLAYING);
        
        this.resetGame();
        this.gameLoop();
        
        // Фоновая музыка
        if (this.settings.soundEnabled && this.sounds.bgMusic) {
            try {
                this.sounds.bgMusic.volume = this.settings.soundVolume / 100;
                this.sounds.bgMusic.play().catch(e => {
                    console.log('Background music play failed:', e);
                });
            } catch (error) {
                console.log('Sound error:', error);
            }
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
        
        // Обновление статистики на экране паузы
        const pauseTime = document.getElementById('pauseTime');
        const pauseBarriers = document.getElementById('pauseBarriers');
        
        if (pauseTime) pauseTime.textContent = Utils.formatTime(this.gameTime);
        if (pauseBarriers) pauseBarriers.textContent = this.player.barriers;
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
        const finalTime = document.getElementById('finalTime');
        const finalBarriers = document.getElementById('finalBarriers');
        const bestTime = document.getElementById('bestTime');
        
        if (finalTime) finalTime.textContent = Utils.formatTime(this.gameTime);
        if (finalBarriers) finalBarriers.textContent = this.player.barriers;
        
        const storedBestTime = Utils.getStorage('bestTime', 0);
        if (this.gameTime > storedBestTime) {
            Utils.setStorage('bestTime', this.gameTime);
        }
        if (bestTime) bestTime.textContent = Utils.formatTime(storedBestTime);
        
        this.updateStatistics();
        
        // Звук и вибрация
        Utils.playSound(this.sounds.gameOver);
        if (this.settings.vibration) {
            Utils.vibrate([200, 100, 200]);
        }
        
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
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.pause();
            this.sounds.bgMusic.currentTime = 0;
        }
    }

    useBarrier() {
        if (this.state.is(GameState.STATES.PLAYING)) {
            if (this.player.useBarrier()) {
                this.updateHUD();
            } else {
                if (this.settings.vibration) {
                    Utils.vibrate([50]);
                }
            }
        }
    }

    updateHUD() {
        const timer = document.getElementById('timer');
        if (timer) {
            timer.textContent = Utils.formatTime(this.gameTime);
        }
        
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

        try {
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Error in game loop:', error);
            this.showMainMenu();
        }
    }

    update() {
        try {
            // Обновление времени игры
            this.gameTime += 1/60;

            // Обновление HUD каждую секунду
            if (Math.floor(this.gameTime * 60) % 60 === 0) {
                this.updateHUD();
            }

            // Обновление игровых объектов
            this.player.update();
            this.enemy.update(this.player);
            this.barrierManager.update(this.player);
            this.updateEffects();
            this.updateCamera();

            // Проверка столкновения
            if (this.enemy.checkCollision(this.player)) {
                this.gameOver();
                return;
            }

            // Увеличение сложности со временем
            if (this.gameTime > 30) {
                const speedMultiplier = 1 + (this.gameTime - 30) / 120;
                this.enemy.speed = GameConstants.DIFFICULTY[this.difficulty].enemySpeed * speedMultiplier;
            }
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            try {
                this.effects[i].update();
                if (this.effects[i].isDead()) {
                    this.effects.splice(i, 1);
                }
            } catch (error) {
                console.error('Error updating effect:', error);
                this.effects.splice(i, 1);
            }
        }
    }

    updateCamera() {
        const playerPos = this.player.getPosition();
        
        // Камера следует за игроком
        this.camera.x = playerPos.x - this.canvas.width / (2 * this.camera.zoom);
        this.camera.y = playerPos.y - this.canvas.height / (2 * this.camera.zoom);
        
        // Ограничение камеры в пределах игрового мира
        const maxX = GameConstants.CANVAS_WIDTH - this.canvas.width / this.camera.zoom;
        const maxY = GameConstants.CANVAS_HEIGHT - this.canvas.height / this.camera.zoom;
        
        this.camera.x = Utils.clamp(this.camera.x, 0, maxX);
        this.camera.y = Utils.clamp(this.camera.y, 0, maxY);
    }

    render() {
        try {
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
            
            // Отрисовка эффектов
            this.effects.forEach(effect => {
                try {
                    effect.draw(this.ctx);
                } catch (error) {
                    console.error('Error drawing effect:', error);
                }
            });

            this.ctx.restore();
        } catch (error) {
            console.error('Error in render:', error);
            throw error;
        }
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
        const soundVolume = document.getElementById('soundVolume');
        const volumeValue = document.getElementById('volumeValue');
        const gameDifficulty = document.getElementById('gameDifficulty');
        const vibration = document.getElementById('vibration');
        
        if (soundVolume) soundVolume.value = this.settings.soundVolume;
        if (volumeValue) volumeValue.textContent = this.settings.soundVolume + '%';
        if (gameDifficulty) gameDifficulty.value = this.settings.difficulty;
        if (vibration) vibration.checked = this.settings.vibration;
    }

    saveSettings() {
        const soundVolume = document.getElementById('soundVolume');
        const gameDifficulty = document.getElementById('gameDifficulty');
        const vibration = document.getElementById('vibration');
        
        if (!soundVolume || !gameDifficulty || !vibration) {
            console.error('Settings elements not found');
            return;
        }
        
        this.settings = {
            soundVolume: parseInt(soundVolume.value),
            soundEnabled: true,
            vibration: vibration.checked,
            difficulty: gameDifficulty.value
        };
        
        Utils.setStorage('gameSettings', this.settings);
        this.difficulty = this.settings.difficulty;
        this.enemy.setDifficulty(this.difficulty);
        
        // Применение настроек звука
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.volume = this.settings.soundVolume / 100;
        }
        
        this.showMainMenu();
    }

    // Статистика
    loadStatistics() {
        const stats = Utils.getStorage('gameStatistics', {
            bestTime: 0,
            totalGames: 0,
            totalBarriers: 0
        });
        
        const statBestTime = document.getElementById('statBestTime');
        const statTotalGames = document.getElementById('statTotalGames');
        const statTotalBarriers = document.getElementById('statTotalBarriers');
        
        if (statBestTime) statBestTime.textContent = Utils.formatTime(stats.bestTime);
        if (statTotalGames) statTotalGames.textContent = stats.totalGames;
        if (statTotalBarriers) statTotalBarriers.textContent = stats.totalBarriers;
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

// Автоматическая инициализация при загрузке страницы
window.addEventListener('load', function() {
    console.log('Page fully loaded, initializing game...');
    
    // Небольшая задержка для гарантии загрузки DOM
    setTimeout(() => {
        try {
            if (!window.gameInstance) {
                window.gameInstance = new Game();
                console.log('Game instance created successfully');
                
                // Скрываем экран загрузки через 2 секунды максимум
                setTimeout(() => {
                    const loadingScreen = document.getElementById('loadingScreen');
                    const mainMenu = document.getElementById('mainMenu');
                    
                    if (loadingScreen && !loadingScreen.classList.contains('hidden') && 
                        mainMenu && mainMenu.classList.contains('hidden')) {
                        window.gameInstance.showMainMenu();
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to create game instance:', error);
            
            // Fallback - показываем меню даже при ошибке
            const loadingScreen = document.getElementById('loadingScreen');
            const mainMenu = document.getElementById('mainMenu');
            
            if (loadingScreen && mainMenu) {
                loadingScreen.classList.add('hidden');
                mainMenu.classList.remove('hidden');
            }
        }
    }, 100);
});

// Глобальный обработчик ошибок
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});
