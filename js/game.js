// 游戏状态管理

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.state = GameState.MENU;

        // 游戏数据
        this.gold = 300;
        this.lives = 20;
        this.totalKills = 0;

        // 游戏对象
        this.map = new GameMap();
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.waveManager = new WaveManager();

        // UI
        this.ui = new UI(this);

        // 输入处理
        this.setupInput();

        // 性能优化
        this.lastTime = 0;
        this.deltaTime = 0;
    }

    setupInput() {
        // 鼠标点击
        this.canvas.addEventListener('click', (e) => {
            if (this.state !== GameState.PLAYING) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.handleClick(x, y);
        });

        // 鼠标移动（用于预览）
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state !== GameState.PLAYING) return;

            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // 右键取消选择
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.ui.deselectAll();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (this.state !== GameState.PLAYING) return;

            switch (e.key) {
                case 'Escape':
                    this.ui.deselectAll();
                    break;
                case ' ':
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case '1':
                    this.ui.selectTowerType('guardian');
                    break;
                case '2':
                    this.ui.selectTowerType('photon');
                    break;
                case '3':
                    this.ui.selectTowerType('cryo');
                    break;
                case '4':
                    this.ui.selectTowerType('rocket');
                    break;
                case '5':
                    this.ui.selectTowerType('tesla');
                    break;
            }
        });
    }

    handleClick(x, y) {
        const gridPos = this.map.getGridPosition(x, y);

        // 检查是否点击了已有的塔
        const clickedTower = this.getTowerAt(gridPos.row, gridPos.col);

        if (clickedTower) {
            // 选择已有的塔
            this.ui.selectTower(clickedTower);
            return;
        }

        // 如果有选中的塔类型，尝试放置
        if (this.ui.selectedTowerType) {
            this.placeTower(this.ui.selectedTowerType, gridPos.row, gridPos.col);
            return;
        }

        // 点击空白区域取消选择
        this.ui.deselectAll();
    }

    getTowerAt(row, col) {
        return this.towers.find(t => t.row === row && t.col === col);
    }

    placeTower(type, row, col) {
        const config = TowerTypes[type];
        if (!config) return false;

        // 检查是否可以放置
        if (!this.map.canBuild(row, col)) {
            this.ui.showMessage('无法在此处建造！');
            return false;
        }

        // 检查金币
        if (this.gold < config.cost) {
            this.ui.showMessage('金币不足！');
            return false;
        }

        // 创建塔
        const tower = new Tower(type, row, col);
        tower.enemies = this.enemies; // 用于特斯拉塔
        this.towers.push(tower);

        // 扣除金币
        this.gold -= config.cost;

        // 标记网格为已占用
        this.map.grid[row][col] = 3; // 3 = 已建塔

        // 创建放置特效
        const pos = this.map.getPixelPosition(row, col);
        this.particles.push(...Utils.createParticles(pos.x, pos.y, 15, config.color, 4));

        return true;
    }

    upgradeTower(tower) {
        if (!tower || tower.level >= tower.maxLevel) return false;

        const cost = tower.getUpgradeCost();
        if (this.gold < cost) {
            this.ui.showMessage('金币不足！');
            return false;
        }

        if (tower.upgrade()) {
            this.gold -= cost;
            return true;
        }

        return false;
    }

    sellTower(tower) {
        if (!tower) return false;

        const value = tower.getSellValue();
        this.gold += value;

        // 从列表中移除
        const index = this.towers.indexOf(tower);
        if (index > -1) {
            this.towers.splice(index, 1);
        }

        // 恢复网格状态
        this.map.grid[tower.row][tower.col] = 0;

        // 创建出售特效
        this.particles.push(...Utils.createParticles(tower.x, tower.y, 10, '#ffd700', 3));

        return true;
    }

    startWave() {
        if (this.waveManager.startWave()) {
            this.ui.showMessage(`第 ${this.waveManager.currentWave} 波开始！`);
        }
    }

    startGame() {
        this.state = GameState.PLAYING;
        this.ui.hideMenu();
        this.reset();
    }

    restart() {
        this.ui.hideGameOver();
        this.reset();
        this.state = GameState.PLAYING;
    }

    reset() {
        this.gold = 300;
        this.lives = 20;
        this.totalKills = 0;

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];

        this.waveManager = new WaveManager();
        this.map = new GameMap();

        this.ui.deselectAll();
        this.ui.update();
    }

    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.ui.showPause();
        } else if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.ui.hidePause();
        }
    }

    update(currentTime) {
        // 计算deltaTime
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // 限制deltaTime防止大跳跃
        this.deltaTime = Math.min(this.deltaTime, 0.1);

        if (this.state !== GameState.PLAYING) return;

        // 更新波次
        this.waveManager.update(this.deltaTime, this.map.detailedPath, this.enemies);

        // 检查波次完成奖励
        if (this.waveManager.waveComplete && !this.waveManager.isWaveActive) {
            const bonus = this.waveManager.getBonusGold();
            if (bonus > 0) {
                this.gold += bonus;
                this.ui.showMessage(`波次完成！+${bonus}💰`);
                this.waveManager.waveComplete = false;
            }
        }

        // 检查胜利
        if (this.waveManager.allWavesComplete) {
            this.state = GameState.VICTORY;
            this.ui.showGameOver(true);
            return;
        }

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.deltaTime);

            // 检查敌人是否到达终点
            if (enemy.reachedEnd) {
                this.lives--;
                this.enemies.splice(i, 1);

                if (this.lives <= 0) {
                    this.state = GameState.GAME_OVER;
                    this.ui.showGameOver(false);
                    return;
                }
                continue;
            }

            // 检查敌人死亡
            if (enemy.isDead && enemy.deathTime > 0.5) {
                if (!enemy.reachedEnd) {
                    this.gold += enemy.reward;
                    this.totalKills++;
                }
                this.enemies.splice(i, 1);
            }
        }

        // 更新防御塔
        for (const tower of this.towers) {
            tower.update(this.deltaTime, this.enemies, this.projectiles);
        }

        // 更新投射物
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];

            // 设置追踪目标
            if (proj.isHoming && !proj.target && this.enemies.length > 0) {
                proj.target = this.enemies[0];
            }

            proj.update(this.deltaTime, this.enemies);

            if (proj.isDead) {
                // 创建击中特效
                if (proj.splashRadius > 0) {
                    this.particles.push(...Utils.createParticles(proj.x, proj.y, 20, proj.color, 5));
                }
                this.projectiles.splice(i, 1);
            }
        }

        // 更新粒子
        Utils.updateParticles(this.particles, this.deltaTime);

        // 更新UI
        this.ui.update();
    }

    draw() {
        const ctx = this.ctx;

        // 清空画布
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 绘制地图
        this.map.draw(ctx);

        // 绘制防御塔
        for (const tower of this.towers) {
            tower.draw(ctx, tower === this.ui.selectedTower);
        }

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }

        // 绘制投射物
        for (const proj of this.projectiles) {
            proj.draw(ctx);
        }

        // 绘制粒子
        Utils.drawParticles(ctx, this.particles);

        // 绘制放置预览
        if (this.state === GameState.PLAYING && this.ui.selectedTowerType && this.mouseX !== undefined) {
            this.drawPlacementPreview(ctx);
        }
    }

    drawPlacementPreview(ctx) {
        const gridPos = this.map.getGridPosition(this.mouseX, this.mouseY);
        const canPlace = this.map.canBuild(gridPos.row, gridPos.col);
        const config = TowerTypes[this.ui.selectedTowerType];

        if (!config) return;

        const pos = this.map.getPixelPosition(gridPos.row, gridPos.col);

        // 绘制射程预览
        ctx.fillStyle = canPlace ? 'rgba(74, 255, 74, 0.1)' : 'rgba(255, 74, 74, 0.1)';
        ctx.strokeStyle = canPlace ? 'rgba(74, 255, 74, 0.5)' : 'rgba(255, 74, 74, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, config.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 绘制塔预览
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 绘制网格高亮
        ctx.strokeStyle = canPlace ? '#4aff4a' : '#ff4a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            gridPos.col * TILE_SIZE,
            gridPos.row * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE
        );
    }

    // 游戏主循环
    gameLoop(currentTime) {
        this.update(currentTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}
