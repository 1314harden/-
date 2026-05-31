// 音效管理器
const AudioManager = {
    enabled: true,
    sounds: {},
    volume: 0.3,

    init() {
        // 预定义音效路径（实际项目中需要音频文件）
        this.sounds = {
            'tower_place': { url: 'audio/tower_place.mp3' },
            'tower_shoot': { url: 'audio/tower_shoot.mp3' },
            'enemy_hit': { url: 'audio/enemy_hit.mp3' },
            'enemy_die': { url: 'audio/enemy_die.mp3' },
            'button_click': { url: 'audio/button_click.mp3' },
            'wave_start': { url: 'audio/wave_start.mp3' },
            'game_over': { url: 'audio/game_over.mp3' },
            'victory': { url: 'audio/victory.mp3' }
        };
    },

    play(soundName) {
        if (!this.enabled) return;

        try {
            // 这里使用Web Audio API模拟音效
            this.playWebAudio(soundName);
        } catch (e) {
            console.warn(`无法播放音效: ${soundName}`, e);
        }
    },

    playWebAudio(soundName) {
        // 创建音频上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // 根据音效类型设置不同频率
        let frequency = 440;
        switch(soundName) {
            case 'tower_place': frequency = 523.25; break; // C5
            case 'tower_shoot': frequency = 659.25; break; // E5
            case 'enemy_hit': frequency = 349.23; break;   // F4
            case 'enemy_die': frequency = 293.66; break;   // D4
            case 'button_click': frequency = 392.00; break; // G4
            case 'wave_start': frequency = 587.33; break;  // D5
            case 'game_over': frequency = 220.00; break;   // A3
            case 'victory': frequency = 880.00; break;     // A5
        }

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    },

    toggle() {
        this.enabled = !this.enabled;
        console.log(`🔊 音效: ${this.enabled ? '开启' : '关闭'}`);
        return this.enabled;
    },

    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
    }
};

// 本地存储管理器
const StorageManager = {
    key: 'starfall_defense_save',

    save(game) {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                highScore: this.getHighScore(),
                stats: {
                    totalKills: game.totalKills || 0,
                    totalWaves: game.waveManager?.currentWave || 0,
                    totalGold: game.score || 0
                },
                settings: {
                    soundEnabled: AudioManager.enabled,
                    showRange: game.ui?.showRange || false
                }
            };

            localStorage.setItem(this.key, JSON.stringify(saveData));
            console.log('💾 游戏数据已保存');
            return true;
        } catch (e) {
            console.error('保存失败:', e);
            return false;
        }
    },

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return null;

            const saveData = JSON.parse(data);
            console.log('📂 游戏数据已加载');
            return saveData;
        } catch (e) {
            console.error('加载失败:', e);
            return null;
        }
    },

    getHighScore() {
        try {
            const data = this.load();
            return data?.stats?.totalGold || 0;
        } catch (e) {
            return 0;
        }
    },

    updateHighScore(score) {
        try {
            const current = this.getHighScore();
            if (score > current) {
                const data = this.load() || {};
                data.highScore = score;
                localStorage.setItem(this.key, JSON.stringify(data));
                console.log(`🏆 新纪录! ${score}`);
                return true;
            }
            return false;
        } catch (e) {
            console.error('更新高分失败:', e);
            return false;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.key);
            console.log('🗑️ 游戏数据已清除');
            return true;
        } catch (e) {
            console.error('清除失败:', e);
            return false;
        }
    }
};

// 成就系统
const AchievementSystem = {
    achievements: [
        { id: 'first_kill', name: '首杀', description: '消灭第一个敌人', unlocked: false, icon: '🎯' },
        { id: 'tower_master', name: '塔防大师', description: '建造5座不同类型的防御塔', unlocked: false, icon: '🏰' },
        { id: 'wave_champion', name: '波次冠军', description: '完成第10波敌人', unlocked: false, icon: '🌊' },
        { id: 'wealthy_tycoon', name: '富可敌国', description: '累积获得1000金币', unlocked: false, icon: '💰' },
        { id: 'perfect_defense', name: '完美防御', description: '完成一轮波次无伤', unlocked: false, icon: '🛡️' },
        { id: 'fast_learner', name: '快速学习者', description: '在5分钟内完成教程', unlocked: false, icon: '⚡' },
        { id: 'ultimate_victory', name: '终极胜利', description: '完成所有20波敌人', unlocked: false, icon: '🏆' }
    ],

    checkAchievements(game) {
        const unlocked = [];

        // 检查首杀
        if (game.totalKills >= 1 && !this.isUnlocked('first_kill')) {
            this.unlock('first_kill');
            unlocked.push('first_kill');
        }

        // 检查防御塔种类
        const towerTypes = new Set(game.towers.map(t => t.type));
        if (towerTypes.size >= 5 && !this.isUnlocked('tower_master')) {
            this.unlock('tower_master');
            unlocked.push('tower_master');
        }

        // 检查波次完成
        if (game.waveManager?.currentWave >= 10 && !this.isUnlocked('wave_champion')) {
            this.unlock('wave_champion');
            unlocked.push('wave_champion');
        }

        // 检查金币累积
        if (game.score >= 1000 && !this.isUnlocked('wealthy_tycoon')) {
            this.unlock('wealthy_tycoon');
            unlocked.push('wealthy_tycoon');
        }

        return unlocked;
    },

    unlock(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.save();
            this.showNotification(achievement);
            return true;
        }
        return false;
    },

    isUnlocked(id) {
        const achievement = this.achievements.find(a => a.id === id);
        return achievement?.unlocked || false;
    },

    showNotification(achievement) {
        console.log(`🎉 成就解锁: ${achievement.icon} ${achievement.name} - ${achievement.description}`);

        // 在实际游戏中可以显示UI通知
        if (window.game?.ui) {
            window.game.ui.showMessage(`成就解锁: ${achievement.icon} ${achievement.name}`);
        }
    },

    save() {
        try {
            const saveData = this.achievements.map(a => ({ id: a.id, unlocked: a.unlocked }));
            localStorage.setItem('starfall_achievements', JSON.stringify(saveData));
        } catch (e) {
            console.error('保存成就失败:', e);
        }
    },

    load() {
        try {
            const data = localStorage.getItem('starfall_achievements');
            if (data) {
                const saved = JSON.parse(data);
                this.achievements.forEach(achievement => {
                    const savedState = saved.find(s => s.id === achievement.id);
                    if (savedState) {
                        achievement.unlocked = savedState.unlocked;
                    }
                });
            }
        } catch (e) {
            console.error('加载成就失败:', e);
        }
    },

    getUnlockedCount() {
        return this.achievements.filter(a => a.unlocked).length;
    },

    getProgress() {
        return {
            total: this.achievements.length,
            unlocked: this.getUnlockedCount(),
            percentage: Math.round((this.getUnlockedCount() / this.achievements.length) * 100)
        };
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    AudioManager.init();
    AchievementSystem.load();
    console.log('🎵 音效系统已初始化');
    console.log('🏆 成就系统已加载');
});