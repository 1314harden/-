// 性能优化工具 - 新增文件
const Performance = {
    // 帧率统计
    fps: 0,
    lastFpsUpdate: 0,
    frameCount: 0,

    // 对象池
    projectilePool: [],
    particlePool: [],

    // 帧率显示
    updateFPS(time) {
        this.frameCount++;
        if (time - this.lastFpsUpdate >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (time - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = time;
        }
    },

    // 对象池获取
    getProjectile() {
        if (this.projectilePool.length > 0) {
            return this.projectilePool.pop();
        }
        return null;
    },

    getParticle() {
        if (this.particlePool.length > 0) {
            return this.particlePool.pop();
        }
        return null;
    },

    // 对象池回收
    recycleProjectile(projectile) {
        if (this.projectilePool.length < 100) {
            projectile.reset();
            this.projectilePool.push(projectile);
        }
    },

    recycleParticle(particle) {
        if (this.particlePool.length < 200) {
            particle.reset();
            this.particlePool.push(particle);
        }
    },

    // 性能监控
    logPerformance(time) {
        if (time % 5000 < 16) { // 每5秒记录一次
            console.log(`🎮 性能统计: FPS=${this.fps}, 对象池(投射物=${this.projectilePool.length}, 粒子=${this.particlePool.length})`);
        }
    }
};

// 游戏常量 - 集中管理
const GameConstants = {
    // 画布尺寸
    CANVAS_WIDTH: 1000,
    CANVAS_HEIGHT: 700,

    // 游戏设置
    INITIAL_GOLD: 300,
    INITIAL_LIVES: 20,
    TOTAL_WAVES: 20,

    // 网格设置
    GRID_SIZE: 40,
    GRID_ROWS: Math.floor(700 / 40),
    GRID_COLS: Math.floor(1000 / 40),

    // 颜色主题
    COLORS: {
        background: '#0a0a2e',
        primary: '#4a9eff',
        secondary: '#4affff',
        success: '#4aff4a',
        danger: '#ff4a4a',
        warning: '#ffd700',
        info: '#9b59b6'
    },

    // 游戏状态
    GameState: {
        MENU: 0,
        PLAYING: 1,
        PAUSED: 2,
        GAME_OVER: 3
    }
};

// 调试工具
const DebugTools = {
    enabled: false,

    toggle() {
        this.enabled = !this.enabled;
        console.log(`🔧 调试模式: ${this.enabled ? '开启' : '关闭'}`);
        return this.enabled;
    },

    showStats(game) {
        if (!this.enabled) return;

        console.group('🎯 游戏状态');
        console.log(`💰 金币: ${game.gold}`);
        console.log(`❤️ 生命: ${game.lives}`);
        console.log(`👾 敌人: ${game.enemies.length}`);
        console.log(`🏰 防御塔: ${game.towers.length}`);
        console.log(`💥 投射物: ${game.projectiles.length}`);
        console.log(`✨ 粒子: ${game.particles.length}`);
        console.log(`🌊 当前波次: ${game.waveManager.currentWave}`);
        console.groupEnd();
    },

    drawGrid(ctx) {
        if (!this.enabled) return;

        ctx.strokeStyle = 'rgba(74, 158, 255, 0.2)';
        ctx.lineWidth = 1;

        // 绘制网格线
        for (let row = 0; row <= GameConstants.GRID_ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * GameConstants.GRID_SIZE);
            ctx.lineTo(GameConstants.CANVAS_WIDTH, row * GameConstants.GRID_SIZE);
            ctx.stroke();
        }

        for (let col = 0; col <= GameConstants.GRID_COLS; col++) {
            ctx.beginPath();
            ctx.moveTo(col * GameConstants.GRID_SIZE, 0);
            ctx.lineTo(col * GameConstants.GRID_SIZE, GameConstants.CANVAS_HEIGHT);
            ctx.stroke();
        }
    }
};