// 工具函数

const Utils = {
    // 计算两点之间的距离
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // 角度转换
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    // 随机数范围
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // 随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 颜色混合
    lerpColor(color1, color2, t) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * t);
        const g = Math.round(c1.g + (c2.g - c1.g) * t);
        const b = Math.round(c1.b + (c2.b - c1.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    // 绘制圆角矩形
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    },

    // 绘制星形
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    },

    // 粒子效果
    createParticles(x, y, count, color, speed = 3) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.random(-0.3, 0.3);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: Utils.random(2, 5)
            });
        }
        return particles;
    },

    // 更新粒子
    updateParticles(particles, deltaTime) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime * 2;
            p.vx *= 0.98;
            p.vy *= 0.98;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    },

    // 绘制粒子
    drawParticles(ctx, particles) {
        for (const p of particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },

    // 缓动函数
    easeOutQuad(t) {
        return t * (2 - t);
    },

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },

    // 格式化数字
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
};

// 常量定义
const TILE_SIZE = 40;
const GRID_COLS = 25;
const GRID_ROWS = 14;
// 画布尺寸 - 已移动到 performance.js 中的 GameConstants
// 删除重复定义
// const CANVAS_WIDTH = 1000;
// const CANVAS_HEIGHT = 700;

// 游戏状态枚举
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    WAVE_COMPLETE: 'wave_complete',
    GAME_OVER: 'game_over',
    VICTORY: 'victory'
};

// 塔类型配置
const TowerTypes = {
    guardian: {
        name: '机枪塔',
        cost: 100,
        damage: 10,
        range: 120,
        fireRate: 5,
        projectileSpeed: 400,
        color: '#4a9eff',
        projectileColor: '#4affff',
        description: '快速射击，稳定输出'
    },
    photon: {
        name: '激光塔',
        cost: 200,
        damage: 25,
        range: 180,
        fireRate: 1.5,
        projectileSpeed: 800,
        color: '#ff4a4a',
        projectileColor: '#ff4aff',
        pierce: 3,
        description: '穿透伤害，可打多个敌人'
    },
    cryo: {
        name: '冰冻塔',
        cost: 150,
        damage: 8,
        range: 130,
        fireRate: 2,
        projectileSpeed: 300,
        color: '#4affff',
        projectileColor: '#aaffff',
        slowEffect: 0.5,
        slowDuration: 2,
        description: '减速敌人50%'
    },
    rocket: {
        name: '导弹塔',
        cost: 350,
        damage: 60,
        range: 200,
        fireRate: 0.8,
        projectileSpeed: 250,
        color: '#ff9f4a',
        projectileColor: '#ffaa4a',
        splashRadius: 60,
        description: '溅射伤害，范围攻击'
    },
    tesla: {
        name: '电磁塔',
        cost: 300,
        damage: 18,
        range: 100,
        fireRate: 2.5,
        color: '#b84aff',
        chainCount: 5,
        chainRange: 80,
        description: '连锁电击，最多5个目标'
    }
};

// 敌人类型配置
const EnemyTypes = {
    scout: {
        name: '侦察虫',
        health: 50,
        speed: 80,
        reward: 10,
        color: '#4aff4a',
        size: 12,
        canFly: false
    },
    warrior: {
        name: '战士虫',
        health: 150,
        speed: 50,
        reward: 25,
        color: '#ffaa4a',
        size: 14,
        canFly: false
    },
    tank: {
        name: '重型虫',
        health: 500,
        speed: 30,
        reward: 50,
        color: '#ff4a4a',
        size: 18,
        canFly: false
    },
    flyer: {
        name: '飞行虫',
        health: 100,
        speed: 100,
        reward: 30,
        color: '#ff4aff',
        size: 12,
        canFly: true
    },
    elite: {
        name: '精英虫',
        health: 300,
        speed: 60,
        reward: 40,
        color: '#ffd700',
        size: 16,
        canFly: false,
        hasShield: true
    },
    queen: {
        name: '虫族女王',
        health: 2000,
        speed: 25,
        reward: 200,
        color: '#ff00ff',
        size: 25,
        canFly: false,
        isBoss: true
    }
};

// 升级配置
const UpgradeConfig = {
    damageMultiplier: 1.5,
    rangeMultiplier: 1.2,
    costMultiplier: 1.8,
    maxLevel: 3
};
