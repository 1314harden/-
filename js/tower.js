// 防御塔系统

class Tower {
    constructor(type, row, col) {
        const config = TowerTypes[type];
        this.type = type;
        this.name = config.name;
        this.row = row;
        this.col = col;
        this.x = col * TILE_SIZE + TILE_SIZE / 2;
        this.y = row * TILE_SIZE + TILE_SIZE / 2;

        this.level = 1;
        this.maxLevel = UpgradeConfig.maxLevel;

        this.baseDamage = config.damage;
        this.baseRange = config.range;
        this.fireRate = config.fireRate;
        this.cost = config.cost;

        this.damage = this.baseDamage;
        this.range = this.baseRange;

        this.color = config.color;
        this.projectileColor = config.projectileColor;
        this.projectileSpeed = config.projectileSpeed || 400;

        // 特殊属性
        this.pierce = config.pierce || 1;
        this.slowEffect = config.slowEffect || 0;
        this.slowDuration = config.slowDuration || 0;
        this.splashRadius = config.splashRadius || 0;
        this.chainCount = config.chainCount || 0;
        this.chainRange = config.chainRange || 0;

        this.cooldown = 0;
        this.target = null;
        this.rotation = 0;
        this.animTime = 0;

        this.kills = 0;
        this.totalDamage = 0;
    }

    upgrade() {
        if (this.level >= this.maxLevel) return false;

        this.level++;
        this.damage = Math.round(this.baseDamage * Math.pow(UpgradeConfig.damageMultiplier, this.level - 1));
        this.range = Math.round(this.baseRange * Math.pow(UpgradeConfig.rangeMultiplier, this.level - 1));

        return true;
    }

    getUpgradeCost() {
        if (this.level >= this.maxLevel) return 0;
        return Math.round(this.cost * Math.pow(UpgradeConfig.costMultiplier, this.level - 1));
    }

    getSellValue() {
        let totalCost = this.cost;
        for (let i = 1; i < this.level; i++) {
            totalCost += Math.round(this.cost * Math.pow(UpgradeConfig.costMultiplier, i - 1));
        }
        return Math.round(totalCost * 0.6);
    }

    findTarget(enemies) {
        let closestEnemy = null;
        let closestDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            // 飞行单位只能被特定塔攻击
            if (enemy.canFly && this.type !== 'photon' && this.type !== 'rocket') {
                continue;
            }

            const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);

            if (dist <= this.range && dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
        }

        this.target = closestEnemy;
        return closestEnemy;
    }

    update(deltaTime, enemies, projectiles) {
        this.animTime += deltaTime;
        this.cooldown -= deltaTime;

        if (this.cooldown <= 0 && this.findTarget(enemies)) {
            this.fire(projectiles);
            this.cooldown = 1 / this.fireRate;
        }

        // 更新旋转角度
        if (this.target) {
            const targetAngle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
            // 平滑旋转
            let diff = targetAngle - this.rotation;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.rotation += diff * 10 * deltaTime;
        }
    }

    fire(projectiles) {
        if (!this.target) return;

        switch (this.type) {
            case 'guardian':
                this.fireBullet(projectiles);
                break;
            case 'photon':
                this.fireLaser(projectiles);
                break;
            case 'cryo':
                this.firIce(projectiles);
                break;
            case 'rocket':
                this.fireRocket(projectiles);
                break;
            case 'tesla':
                this.fireTesla(projectiles);
                break;
        }
    }

    fireBullet(projectiles) {
        const angle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
        projectiles.push(new Projectile(
            this.x, this.y, angle,
            this.projectileSpeed, this.damage, this.projectileColor,
            'bullet', this
        ));
    }

    fireLaser(projectiles) {
        const angle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
        const proj = new Projectile(
            this.x, this.y, angle,
            this.projectileSpeed, this.damage, this.projectileColor,
            'laser', this
        );
        proj.pierce = this.pierce;
        proj.width = 4;
        proj.length = 30;
        projectiles.push(proj);
    }

    firIce(projectiles) {
        const angle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
        const proj = new Projectile(
            this.x, this.y, angle,
            this.projectileSpeed, this.damage, this.projectileColor,
            'ice', this
        );
        proj.slowEffect = this.slowEffect;
        proj.slowDuration = this.slowDuration;
        proj.size = 8;
        projectiles.push(proj);
    }

    fireRocket(projectiles) {
        const angle = Utils.angle(this.x, this.y, this.target.x, this.target.y);
        const proj = new Projectile(
            this.x, this.y, angle,
            this.projectileSpeed, this.damage, this.projectileColor,
            'rocket', this
        );
        proj.splashRadius = this.splashRadius;
        proj.isHoming = true;
        proj.size = 8;
        projectiles.push(proj);
    }

    fireTesla(projectiles) {
        // 特斯拉塔直接电击，不发射投射物
        // 创建连锁闪电效果
        const targets = [this.target];
        let lastTarget = this.target;

        for (let i = 1; i < this.chainCount; i++) {
            let nearestEnemy = null;
            let nearestDist = this.chainRange;

            // 从游戏获取敌人列表（通过projectile访问）
            for (const enemy of this.enemies || []) {
                if (enemy.isDead || targets.includes(enemy)) continue;

                const dist = Utils.distance(lastTarget.x, lastTarget.y, enemy.x, enemy.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                targets.push(nearestEnemy);
                lastTarget = nearestEnemy;
            }
        }

        // 创建电击效果
        const proj = new Projectile(
            this.x, this.y, 0,
            0, this.damage, this.projectileColor,
            'tesla', this
        );
        proj.chainTargets = targets;
        proj.isInstant = true;
        projectiles.push(proj);
    }

    draw(ctx, isSelected = false) {
        // 绘制射程范围
        if (isSelected) {
            ctx.fillStyle = 'rgba(74, 158, 255, 0.1)';
            ctx.strokeStyle = 'rgba(74, 158, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // 绘制塔基座
        ctx.fillStyle = '#1a1a4a';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 根据类型绘制不同的塔
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        switch (this.type) {
            case 'guardian':
                this.drawGuardian(ctx);
                break;
            case 'photon':
                this.drawPhoton(ctx);
                break;
            case 'cryo':
                this.drawCryo(ctx);
                break;
            case 'rocket':
                this.drawRocket(ctx);
                break;
            case 'tesla':
                this.drawTesla(ctx);
                break;
        }

        ctx.restore();

        // 绘制等级
        if (this.level > 1) {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★'.repeat(this.level - 1), this.x, this.y + 25);
        }
    }

    drawGuardian(ctx) {
        // 机枪塔 - 圆形底座+枪管
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // 枪管
        ctx.fillStyle = '#2a5aaa';
        ctx.fillRect(8, -3, 15, 6);

        // 枪口闪光效果
        if (this.cooldown < 0.1) {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(20, -2, 5, 4);
        }
    }

    drawPhoton(ctx) {
        // 激光塔 - 晶体形状
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();

        // 发光核心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5 + Math.sin(this.animTime * 5) * 2, 0, Math.PI * 2);
        ctx.fill();

        // 能量环
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawCryo(ctx) {
        // 冰冻塔 - 雪花形状
        ctx.fillStyle = this.color;

        // 绘制六角星
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.fillRect(-2, 0, 4, 14);
            ctx.fillRect(-5, 10, 10, 3);
            ctx.restore();
        }

        // 中心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRocket(ctx) {
        // 导弹塔 - 三角形发射器
        ctx.fillStyle = this.color;

        // 发射器底座
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(12, 8);
        ctx.lineTo(-12, 8);
        ctx.closePath();
        ctx.fill();

        // 导弹
        ctx.fillStyle = '#ff6a4a';
        ctx.beginPath();
        ctx.moveTo(5, -8);
        ctx.lineTo(15, 0);
        ctx.lineTo(5, 8);
        ctx.closePath();
        ctx.fill();
    }

    drawTesla(ctx) {
        // 电磁塔 - 球形
        const pulse = Math.sin(this.animTime * 8) * 3;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 14 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // 电弧效果
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const angle = this.animTime * 3 + i * Math.PI / 2;
            ctx.arc(0, 0, 12 + pulse, angle, angle + 0.5);
            ctx.stroke();
        }

        // 中心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}
