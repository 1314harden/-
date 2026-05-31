// 优化后的游戏配置
const EnhancedConfig = {
    // 性能优化设置
    performance: {
        maxProjectiles: 100,     // 最大投射物数量限制
        maxParticles: 200,       // 最大粒子效果数量限制
        objectPoolSize: 50,      // 对象池大小
        frameTimeWarning: 16.67, // 每帧耗时警告阈值(ms)
    },

    // 游戏平衡性调整
    balance: {
        // 塔属性调整
        towerCostMultiplier: 1.2,  // 升级费用增长倍数
        towerUpgradeBonus: 0.3,    // 每次升级提升比例

        // 波次难度曲线
        waveDifficulty: {
            baseEnemies: 5,
            enemyIncrease: 1.2,    // 每波敌人数量增长倍数
            healthIncrease: 1.15,  // 每波敌人生命值增长倍数
            speedIncrease: 1.05,   // 每波敌人速度增长倍数
        },

        // 经济系统
        economy: {
            killReward: 10,        // 击杀基础奖励
            waveCompletion: 100,   // 波次完成基础奖励
            interestRate: 0.01,    // 每回合利息率
            maxInterest: 50,       // 每回合最大利息
        }
    },

    // 视觉效果增强
    visuals: {
        // 粒子效果
        particleLifetime: 1.0,     // 粒子生存时间(秒)
        particleSize: 3,           // 粒子大小
        particleSpeed: 2,          // 粒子速度

        // 动画效果
        animationSpeed: 0.2,       // 动画速度
        shakeIntensity: 3,         // 屏幕震动强度
        glowIntensity: 0.5,        // 发光效果强度
    },

    // 游戏体验优化
    gameplay: {
        // 塔放置辅助
        towerPlacement: {
            showGrid: true,        // 显示网格
            showRange: true,       // 显示攻击范围
            snapToGrid: true,      // 对齐网格
            invalidColor: '#ff4a4a', // 无效位置颜色
        },

        // 信息显示
        infoDisplay: {
            showDamageNumbers: true,  // 显示伤害数字
            showEnemyHealth: true,    // 显示敌人生命值
            showTowerStats: true,     // 显示塔属性
            showWaveInfo: true,       // 显示波次信息
        },

        // 快捷键
        hotkeys: {
            towerSelection: ['1', '2', '3', '4', '5'],  // 塔选择快捷键
            pause: [' ', 'p'],       // 暂停快捷键
            startWave: ['w'],        // 开始波次快捷键
            toggleRange: ['r'],      // 切换攻击范围显示
            toggleDebug: ['F1'],     // 调试模式
            toggleStats: ['F2'],     // 统计信息
        }
    },

    // 声音效果
    audio: {
        enabled: true,
        volume: 0.3,
        soundEffects: {
            towerPlace: { frequency: 523.25, duration: 0.2 },
            towerShoot: { frequency: 659.25, duration: 0.1 },
            enemyHit: { frequency: 349.23, duration: 0.15 },
            enemyDie: { frequency: 293.66, duration: 0.3 },
            buttonClick: { frequency: 392.00, duration: 0.1 },
            waveStart: { frequency: 587.33, duration: 0.5 },
            gameOver: { frequency: 220.00, duration: 1.0 },
            victory: { frequency: 880.00, duration: 1.0 },
        }
    }
};

// 优化工具类
const OptimizationTools = {
    // 对象池管理
    createObjectPool(createFn, size = 50) {
        const pool = [];
        for (let i = 0; i < size; i++) {
            pool.push(createFn());
        }
        return {
            pool,
            get() {
                return pool.length > 0 ? pool.pop() : createFn();
            },
            release(obj) {
                if (pool.length < size * 2) { // 限制池大小
                    pool.push(obj);
                }
            },
            size() {
                return pool.length;
            }
        };
    },

    // 批处理绘制
    batchDraw(ctx, drawables, batchSize = 50) {
        for (let i = 0; i < drawables.length; i += batchSize) {
            const batch = drawables.slice(i, i + batchSize);
            ctx.save();
            batch.forEach(drawable => drawable.draw(ctx));
            ctx.restore();
        }
    },

    // 空间分区优化
    createSpatialHash(cellSize = 100) {
        const hash = new Map();

        return {
            cellSize,
            clear() {
                hash.clear();
            },
            insert(obj, x, y) {
                const cellX = Math.floor(x / cellSize);
                const cellY = Math.floor(y / cellSize);
                const key = `${cellX},${cellY}`;

                if (!hash.has(key)) {
                    hash.set(key, []);
                }
                hash.get(key).push(obj);
            },
            query(x, y, radius) {
                const results = [];
                const minX = Math.floor((x - radius) / cellSize);
                const maxX = Math.floor((x + radius) / cellSize);
                const minY = Math.floor((y - radius) / cellSize);
                const maxY = Math.floor((y + radius) / cellSize);

                for (let cx = minX; cx <= maxX; cx++) {
                    for (let cy = minY; cy <= maxY; cy++) {
                        const key = `${cx},${cy}`;
                        if (hash.has(key)) {
                            results.push(...hash.get(key));
                        }
                    }
                }
                return results;
            }
        };
    },

    // 性能监控
    createPerformanceMonitor() {
        let frameTimes = [];
        let lastUpdate = 0;

        return {
            recordFrameTime(time) {
                frameTimes.push(time);
                if (frameTimes.length > 60) frameTimes.shift();
            },
            getAverageFPS() {
                if (frameTimes.length < 2) return 0;
                const avgTime = frameTimes.reduce((a, b) => a + b) / frameTimes.length;
                return Math.round(1000 / avgTime);
            },
            getMinFPS() {
                if (frameTimes.length < 2) return 0;
                const maxTime = Math.max(...frameTimes);
                return Math.round(1000 / maxTime);
            },
            getMaxFPS() {
                if (frameTimes.length < 2) return 0;
                const minTime = Math.min(...frameTimes);
                return Math.round(1000 / minTime);
            },
            logStats() {
                const now = performance.now();
                if (now - lastUpdate > 5000) { // 每5秒记录一次
                    console.log(`📊 性能统计: 平均FPS=${this.getAverageFPS()}, 最低FPS=${this.getMinFPS()}, 最高FPS=${this.getMaxFPS()}`);
                    lastUpdate = now;
                }
            }
        };
    }
};

// 游戏状态保存优化
const GameStateManager = {
    key: 'starfall_defense_state',
    version: '1.1',

    compressData(data) {
        // 简单压缩：只保存必要信息
        return {
            v: this.version,
            t: Date.now(),
            g: data.gold,
            l: data.lives,
            s: data.score,
            k: data.totalKills,
            w: data.waveManager?.currentWave || 0,
            a: data.achievements || []
        };
    },

    decompressData(compressed) {
        if (!compressed || compressed.v !== this.version) return null;

        return {
            gold: compressed.g,
            lives: compressed.l,
            score: compressed.s,
            totalKills: compressed.k,
            currentWave: compressed.w,
            achievements: compressed.a,
            timestamp: compressed.t
        };
    },

    save(game) {
        try {
            const compressed = this.compressData({
                gold: game.gold,
                lives: game.lives,
                score: game.score,
                totalKills: game.totalKills,
                waveManager: game.waveManager,
                achievements: AchievementSystem.achievements.filter(a => a.unlocked).map(a => a.id)
            });

            localStorage.setItem(this.key, JSON.stringify(compressed));
            console.log('💾 游戏状态已保存（压缩版）');
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

            const compressed = JSON.parse(data);
            const decompressed = this.decompressData(compressed);

            if (decompressed) {
                console.log('📂 游戏状态已加载');
                return decompressed;
            }
            return null;
        } catch (e) {
            console.error('加载失败:', e);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(this.key);
            console.log('🗑️ 游戏状态已清除');
            return true;
        } catch (e) {
            console.error('清除失败:', e);
            return false;
        }
    },

    // 自动保存
    autoSave(game, interval = 30000) { // 每30秒自动保存
        setInterval(() => {
            if (game.state === GameConstants.GameState.PLAYING) {
                this.save(game);
            }
        }, interval);
    }
};

// 游戏教程系统
const TutorialSystem = {
    steps: [
        { id: 'welcome', title: '欢迎来到星际防线', content: '保卫人类最后的殖民地，抵御外星虫族入侵！', completed: false },
        { id: 'tower_selection', title: '选择防御塔', content: '点击下方塔图标选择要建造的防御塔类型', completed: false },
        { id: 'tower_placement', title: '放置防御塔', content: '在地图的绿色格子上点击放置防御塔', completed: false },
        { id: 'tower_upgrade', title: '升级防御塔', content: '点击已有的防御塔进行升级或出售', completed: false },
        { id: 'wave_start', title: '开始波次', content: '点击"开始波次"按钮开始敌人进攻', completed: false },
        { id: 'game_goal', title: '游戏目标', content: '阻止敌人到达终点！保护你的生命值', completed: false }
    ],

    currentStep: 0,
    active: true,

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) return;

        const step = this.steps[stepIndex];
        console.log(`📚 教程: ${step.title} - ${step.content}`);

        // 在实际游戏中可以显示UI提示
        if (window.game?.ui) {
            window.game.ui.showMessage(`教程: ${step.title} - ${step.content}`);
        }
    },

    completeStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step && !step.completed) {
            step.completed = true;
            console.log(`✅ 教程完成: ${step.title}`);

            // 移动到下一步
            const nextIndex = this.steps.findIndex(s => s.id === stepId) + 1;
            if (nextIndex < this.steps.length) {
                this.currentStep = nextIndex;
                this.showStep(nextIndex);
            } else {
                this.complete();
            }
        }
    },

    complete() {
        this.active = false;
        console.log('🎓 所有教程已完成！');
        if (window.game?.ui) {
            window.game.ui.showMessage('🎓 教程完成！开始你的防御战吧！');
        }
    },

    checkTutorialProgress(game) {
        if (!this.active) return;

        // 根据游戏状态触发教程步骤
        if (game.towers.length > 0 && !this.steps[2].completed) {
            this.completeStep('tower_placement');
        }
        if (game.waveManager?.isWaveActive && !this.steps[4].completed) {
            this.completeStep('wave_start');
        }
    },

    start() {
        this.active = true;
        this.currentStep = 0;
        this.showStep(0);
        console.log('🚀 教程系统启动');
    },

    skip() {
        this.active = false;
        console.log('⏭️ 教程已跳过');
    },

    reset() {
        this.steps.forEach(step => step.completed = false);
        this.currentStep = 0;
        this.active = true;
        console.log('🔄 教程已重置');
    }
};

// 游戏分析器
const GameAnalytics = {
    events: [],
    sessionStart: Date.now(),

    track(event, data = {}) {
        const eventData = {
            event,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.sessionStart,
            ...data
        };

        this.events.push(eventData);
        console.log(`📈 分析事件: ${event}`, data);

        // 限制事件数量
        if (this.events.length > 1000) {
            this.events = this.events.slice(-500);
        }
    },

    trackGameStart() {
        this.track('game_start', {
            difficulty: 'normal',
            time: new Date().toISOString()
        });
    },

    trackTowerBuilt(type, cost) {
        this.track('tower_built', { type, cost });
    },

    trackEnemyKilled(type, reward) {
        this.track('enemy_killed', { type, reward });
    },

    trackWaveComplete(wave, reward, duration) {
        this.track('wave_complete', { wave, reward, duration });
    },

    trackGameOver(victory, score, wave) {
        this.track('game_over', { victory, score, wave });
    },

    getStats() {
        const towerTypes = {};
        const enemyTypes = {};
        let totalGold = 0;
        let totalKills = 0;

        this.events.forEach(event => {
            if (event.event === 'tower_built') {
                towerTypes[event.type] = (towerTypes[event.type] || 0) + 1;
                totalGold += event.cost || 0;
            } else if (event.event === 'enemy_killed') {
                enemyTypes[event.type] = (enemyTypes[event.type] || 0) + 1;
                totalGold += event.reward || 0;
                totalKills++;
            }
        });

        return {
            totalEvents: this.events.length,
            totalGold,
            totalKills,
            towerTypes,
            enemyTypes,
            sessionDuration: Date.now() - this.sessionStart
        };
    },

    logSummary() {
        const stats = this.getStats();
        console.group('📊 游戏分析总结');
        console.log(`总游戏时间: ${Math.round(stats.sessionDuration / 1000)}秒`);
        console.log(`总击杀数: ${stats.totalKills}`);
        console.log(`总金币: ${stats.totalGold}`);
        console.log('防御塔建造统计:', stats.towerTypes);
        console.log('敌人击杀统计:', stats.enemyTypes);
        console.groupEnd();
    }
};