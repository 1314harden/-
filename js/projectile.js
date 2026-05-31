// 投射物系统

class Projectile {
    constructor(x, y, angle, speed, damage, color, type, source) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.color = color;
        this.type = type;
        this.source = source;

        this.isDead = false;
        this.size = 5;
        this.width = 3;
        this.length = 10;

        // 特殊属性
        this.pierce = 1;
        this.hitCount = 0;
        this.splashRadius = 0;
        this.slowEffect = 0;
        this.slowDuration = 0;
        this.isHoming = false;
        this.isInstant = false;
        this.chainTargets = [];
        this.target = null;

        // 动画
        this.animTime = 0;
        this.trail = [];
    }

    update(deltaTime, enemies) {
        this.animTime += deltaTime;

        if (this.isInstant) {
            // 即时投射物（如特斯拉电击）
            this.executeInstant(enemies);
            this.isDead = true;
            return;
        }

        // 追踪导弹
        if (this.isHoming && this.target && !this.target.isDead) {
            const targetAngle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
            let diff = targetAngle - this.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.angle += diff * 5 * deltaTime;
        }

        // 移动
        this.x += Math.cos(this.angle) * this.speed * deltaTime;
        this.y += Math.sin(this.angle) * this.speed * deltaTime;

        // 记录轨迹
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) {
            this.trail.shift();
        }

        // 检测碰撞
        this.checkCollision(enemies);

        // 边界检测
        if (this.x < -50 || this.x > GameConstants.CANVAS_WIDTH + 50 ||
            this.y < -50 || this.y > GameConstants.CANVAS_HEIGHT + 50) {
            this.isDead = true;
        }
    }

    checkCollision(enemies) {
        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);

            if (dist < enemy.size + this.size) {
                this.hit(enemy, enemies);

                this.hitCount++;
                if (this.hitCount >= this.pierce) {
                    this.isDead = true;
                    break;
                }
            }
        }
    }

    hit(enemy, enemies) {
        // 造成伤害
        enemy.takeDamage(this.damage, this.source);

        // 溅射伤害
        if (this.splashRadius > 0) {
            for (const other of enemies) {
                if (other === enemy || other.isDead) continue;
                const dist = Utils.distance(enemy.x, enemy.y, other.x, other.y);
                if (dist < this.splashRadius) {
                    const splashDamage = this.damage * (1 - dist / this.splashRadius) * 0.5;
                    other.takeDamage(splashDamage, this.source);
                }
            }
        }

        // 减速效果
        if (this.slowEffect > 0) {
            enemy.applySlow(this.slowEffect, this.slowDuration);
        }
    }

    executeInstant(enemies) {
        // 特斯拉连锁电击
        for (const target of this.chainTargets) {
            if (!target.isDead) {
                target.takeDamage(this.damage, this.source);
            }
        }
    }

    draw(ctx) {
        if (this.isInstant) {
            // 绘制电击效果
            this.drawTeslaEffect(ctx);
            return;
        }

        switch (this.type) {
            case 'bullet':
                this.drawBullet(ctx);
                break;
            case 'laser':
                this.drawLaser(ctx);
                break;
            case 'ice':
                this.drawIce(ctx);
                break;
            case 'rocket':
                this.drawRocket(ctx);
                break;
            default:
                this.drawDefault(ctx);
        }
    }

    drawDefault(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBullet(ctx) {
        // 绘制轨迹
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(this.trail[0]?.x || this.x, this.trail[0]?.y || this.y);
        for (const point of this.trail) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 子弹主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 发光效果
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLaser(ctx) {
        // 激光轨迹
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 光晕
        ctx.fillStyle = 'rgba(255, 74, 255, 0.3)';
        ctx.fillRect(-this.length, -this.width * 2, this.length * 2, this.width * 4);

        // 主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.length, -this.width, this.length * 2, this.width * 2);

        // 核心
        ctx.fillStyle = '#fff';
        ctx.fillRect(-this.length, -this.width * 0.3, this.length * 2, this.width * 0.6);

        ctx.restore();
    }

    drawIce(ctx) {
        // 冰晶轨迹
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.animTime * 3);

        // 外圈
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // 内部
        ctx.fillStyle = 'rgba(170, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawRocket(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 尾焰
        ctx.fillStyle = '#ff4a4a';
        ctx.beginPath();
        ctx.moveTo(-this.size * 2, -4);
        ctx.lineTo(-this.size * 3, 0);
        ctx.lineTo(-this.size * 2, 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffaa4a';
        ctx.beginPath();
        ctx.moveTo(-this.size * 1.5, -3);
        ctx.lineTo(-this.size * 2.5, 0);
        ctx.lineTo(-this.size * 1.5, 3);
        ctx.closePath();
        ctx.fill();

        // 火箭主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size * 0.5, -5);
        ctx.lineTo(-this.size * 0.5, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // 烟雾轨迹
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const alpha = (i / this.trail.length) * 0.3;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawTeslaEffect(ctx) {
        // 绘制连锁闪电
        if (!this.chainTargets || this.chainTargets.length === 0) return;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;

        // 从塔到第一个目标
        const source = this.source;
        let lastX = source.x;
        let lastY = source.y;

        for (const target of this.chainTargets) {
            // 绘制锯齿状闪电
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);

            const dx = target.x - lastX;
            const dy = target.y - lastY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const segments = Math.floor(dist / 15);

            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const x = lastX + dx * t;
                const y = lastY + dy * t;

                // 添加随机偏移
                const offsetX = (Math.random() - 0.5) * 15;
                const offsetY = (Math.random() - 0.5) * 15;

                if (i === segments) {
                    ctx.lineTo(target.x, target.y);
                } else {
                    ctx.lineTo(x + offsetX, y + offsetY);
                }
            }

            ctx.stroke();

            // 发光效果
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;

            lastX = target.x;
            lastY = target.y;
        }

        // 在目标位置绘制电击效果
        for (const target of this.chainTargets) {
            ctx.fillStyle = 'rgba(184, 74, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(target.x, target.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
