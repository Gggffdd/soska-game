class Utils {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static getStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('LocalStorage error:', error);
            return defaultValue;
        }
    }

    static setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('LocalStorage error:', error);
            return false;
        }
    }

    static createParticle(x, y, color, context) {
        return {
            x: x,
            y: y,
            vx: Utils.random(-2, 2),
            vy: Utils.random(-2, 2),
            life: 1,
            maxLife: Utils.random(0.5, 1.5),
            color: color,
            size: Utils.random(2, 5),
            update: function() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 0.02;
                this.vx *= 0.98;
                this.vy *= 0.98;
            },
            draw: function() {
                const alpha = this.life / this.maxLife;
                context.save();
                context.globalAlpha = alpha;
                context.fillStyle = this.color;
                context.beginPath();
                context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                context.fill();
                context.restore();
            },
            isDead: function() {
                return this.life <= 0;
            }
        };
    }

    static playSound(audioElement, volume = 1) {
        if (audioElement) {
            try {
                audioElement.volume = volume;
                audioElement.currentTime = 0;
                const playPromise = audioElement.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.log('Audio play failed:', e));
                }
            } catch (error) {
                console.log('Sound error:', error);
            }
        }
    }
}

// Game constants
const GameConstants = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 1200,
    PLAYER_SIZE: 20,
    ENEMY_SIZE: 40,
    BARRIER_SIZE: 15,
    COLLECTION_RADIUS: 25,
    GAME_SPEED: 1,
    DIFFICULTY: {
        easy: { enemySpeed: 1.2, barrierSpawn: 0.02 },
        medium: { enemySpeed: 1.5, barrierSpawn: 0.015 },
        hard: { enemySpeed: 2.0, barrierSpawn: 0.01 }
    }
};

// Game state manager
class GameState {
    static STATES = {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over',
        SETTINGS: 'settings',
        STATS: 'stats'
    };

    constructor() {
        this.currentState = GameState.STATES.LOADING;
        this.previousState = null;
    }

    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
        this.onStateChange(newState, this.previousState);
    }

    onStateChange(newState, oldState) {
        console.log(`State changed: ${oldState} -> ${newState}`);
    }

    is(state) {
        return this.currentState === state;
    }

    goBack() {
        if (this.previousState) {
            this.setState(this.previousState);
        }
    }
}
