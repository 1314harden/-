// 敌人系统

class Enemy {
    constructor(type, path) {
        const config = EnemyTypes[type];
        this.type = type;
        this.name = config.name;

        this.maxHealth = config.health;
        this.health = this.maxHealth;
        this.baseSpeed = config.speed;
        this.speed = this.baseSpeed;
        this.reward = config.reward;
        this.color = config.color;
        this.size = config.size;
        this.canFly = config.canFly || false;
        this.hasShield = config.hasShield || false;
        this.isBoss = config.isBoss || false;

        this.path = path;
        this.pathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;

        this.isDead = false;
        this.reachedEnd = false;

        // 状态效果
        this.slowAmount = 1;
        this.slowDuration = 0;

        // 动画
        this.animTime = Math.random() * 10;
        this.deathTime = 0;

        // 护盾
        this.shieldActive = this.hasShield;
    }

    update(deltaTime) {
        if (this.isDead) {
            this.deathTime += deltaTime;
            return;
        }

        this.animTime += deltaTime;

        // 更新减速效果
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) {
                this.slowAmount = 1;
            }
        }

        // 沿路径移动
        if (this.pathIndex < this.path.length - 1) {
            const target = this.path[this.pathIndex + 1];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const moveSpeed = this.speed * this.slowAmount * deltaTime;

            if (dist < moveSpeed) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / dist) * moveSpeed;
                this.y += (dy / dist) * moveSpeed;
            }
        } else {
            // 到达终点
            this.reachedEnd = true;
            this.isDead = true;
        }
    }

    takeDamage(amount, source = null) {
        // 护盾吸收第一次伤害
        if (this.shieldActive) {
            this.shieldActive = false;
            // 护盾完全吸收伤害
            return;
        }

        this.health -= amount;

        if (source) {
            source.totalDamage += amount;
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            if (source) {
                source.kills++;
            }
        }
    }

    applySlow(amount, duration) {
        this.slowAmount = Math.min(this.slowAmount, 1 - amount);
        this.slowDuration = Math.max(this.slowDuration, duration);
    }

    draw(ctx) {
        if (this.isDead && this.deathTime > 0.5) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isDead) {
            // 死亡动画
            const alpha = 1 - this.deathTime * 2;
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.scale(1 + this.deathTime, 1 + this.deathTime);
        }

        // 飞行单位的阴影
        if (this.canFly) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(3, 5, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 减速效果视觉
        if (this.slowDuration > 0) {
            ctx.fillStyle = 'rgba(74, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 根据类型绘制敌人
        switch (this.type) {
            case 'scout':
                this.drawScout(ctx);
                break;
            case 'warrior':
                this.drawWarrior(ctx);
                break;
            case 'tank':
                this.drawTank(ctx);
                break;
            case 'flyer':
                this.drawFlyer(ctx);
                break;
            case 'elite':
                this.drawElite(ctx);
                break;
            case 'queen':
                this.drawQueen(ctx);
                break;
            default:
                this.drawDefault(ctx);
        }

        ctx.restore();

        // 绘制血条
        if (!this.isDead) {
            this.drawHealthBar(ctx);
        }
    }

    drawDefault(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawScout(ctx) {
        // 小型虫族 - 简单圆形
        const pulse = Math.sin(this.animTime * 5) * 2;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, -2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWarrior(ctx) {
        // 中型虫族 - 甲虫形状
        ctx.fillStyle = this.color;

        // 身体
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.beginPath();
        ctx.arc(0, -this.size * 0.8, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 触角
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -this.size * 0.8);
        ctx.lineTo(-8, -this.size * 1.3);
        ctx.moveTo(4, -this.size * 0.8);
        ctx.lineTo(8, -this.size * 1.3);
        ctx.stroke();

        // 眼睛
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(-3, -this.size * 0.8, 2, 0, Math.PI * 2);
        ctx.arc(3, -this.size * 0.8, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTank(ctx) {
        // 重型虫族 - 大型装甲虫
        ctx.fillStyle = this.color;

        // 装甲外壳
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 甲壳纹理
        ctx.strokeStyle = '#aa3333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
        ctx.stroke();

        // 多个眼睛
        ctx.fillStyle = '#ff0';
        for (let i = 0; i < 3; i++) {
            const angle = -Math.PI / 4 + i * Math.PI / 4;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * 5, Math.sin(angle) * 5 - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawFlyer(ctx) {
        // 飞行单位 - 翅膀效果
        const wingAngle = Math.sin(this.animTime * 15) * 0.5;

        // 翅膀
        ctx.fillStyle = 'rgba(255, 74, 255, 0.7)';
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.beginPath();
        ctx.ellipse(-this.size, 0, this.size * 1.2, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.rotate(-wingAngle);
        ctx.beginPath();
        ctx.ellipse(this.size, 0, this.size * 1.2, this.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.6, this.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, -2, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawElite(ctx) {
        // 精英单位 - 带护盾
        if (this.shieldActive) {
            // 护盾效果
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2);
            ctx.stroke();

            // 护盾光晕
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // 身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();

        // 内部图案
        ctx.fillStyle = '#aa8800';
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.5);
        ctx.lineTo(this.size * 0.5, 0);
        ctx.lineTo(0, this.size * 0.5);
        ctx.lineTo(-this.size * 0.5, 0);
        ctx.closePath();
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawQueen(ctx) {
        // Boss - 虫族女王
        const pulse = Math.sin(this.animTime * 3) * 2;

        // 外壳
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 装饰环
        ctx.strokeStyle = '#ff88ff';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, this.size - 5 - i * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 皇冠效果
        ctx.fillStyle = '#ffd700';
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + i * Math.PI / 4 - Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * (this.size - 8), Math.sin(angle) * (this.size - 8));
            ctx.lineTo(Math.cos(angle) * (this.size + 10), Math.sin(angle) * (this.size + 10));
            ctx.lineTo(Math.cos(angle + 0.15) * (this.size - 5), Math.sin(angle + 0.15) * (this.size - 5));
            ctx.closePath();
            ctx.fill();
        }

        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-6, -3, 4, 0, Math.PI * 2);
        ctx.arc(6, -3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-6, -3, 2, 0, Math.PI * 2);
        ctx.arc(6, -3, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 2 + 10;
        const barHeight = 4;
        const barY = this.y - this.size - 8;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        // 血量
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#4aff4a' : healthPercent > 0.25 ? '#ffaa4a' : '#ff4a4a';
        ctx.fillStyle = healthColor;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        // Boss额外显示血量数值
        if (this.isBoss) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.health}/${this.maxHealth}`, this.x, barY - 3);
        }
    }
}
