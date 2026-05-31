// 波次管理系统

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.maxWaves = 20;
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0.8; // 敌人生成间隔
        this.isWaveActive = false;
        this.waveComplete = false;
        this.allWavesComplete = false;

        // 预定义所有波次
        this.waveDefinitions = this.createWaveDefinitions();
    }

    createWaveDefinitions() {
        const waves = [];

        for (let w = 1; w <= 20; w++) {
            const wave = {
                number: w,
                enemies: [],
                bonusGold: 50 + w * 10
            };

            // 根据波次配置敌人
            const baseCount = 5 + Math.floor(w * 1.5);
            const healthMultiplier = 1 + (w - 1) * 0.15;

            // 第1-4波：只有侦察虫
            if (w <= 4) {
                for (let i = 0; i < baseCount; i++) {
                    wave.enemies.push({ type: 'scout', healthMult: healthMultiplier });
                }
            }
            // 第5-9波：侦察虫 + 战士虫
            else if (w <= 9) {
                const scouts = Math.floor(baseCount * 0.6);
                const warriors = baseCount - scouts;
                for (let i = 0; i < scouts; i++) {
                    wave.enemies.push({ type: 'scout', healthMult: healthMultiplier });
                }
                for (let i = 0; i < warriors; i++) {
                    wave.enemies.push({ type: 'warrior', healthMult: healthMultiplier });
                }
            }
            // 第10波：Boss波
            else if (w === 10) {
                // 前置小兵
                for (let i = 0; i < 10; i++) {
                    wave.enemies.push({ type: 'warrior', healthMult: healthMultiplier });
                }
                // Boss
                wave.enemies.push({ type: 'queen', healthMult: healthMultiplier * 1.5 });
            }
            // 第11-14波：添加重型虫
            else if (w <= 14) {
                const scouts = Math.floor(baseCount * 0.3);
                const warriors = Math.floor(baseCount * 0.4);
                const tanks = baseCount - scouts - warriors;
                for (let i = 0; i < scouts; i++) {
                    wave.enemies.push({ type: 'scout', healthMult: healthMultiplier });
                }
                for (let i = 0; i < warriors; i++) {
                    wave.enemies.push({ type: 'warrior', healthMult: healthMultiplier });
                }
                for (let i = 0; i < tanks; i++) {
                    wave.enemies.push({ type: 'tank', healthMult: healthMultiplier });
                }
            }
            // 第15-17波：添加飞行虫和精英虫
            else if (w <= 17) {
                const scouts = Math.floor(baseCount * 0.2);
                const warriors = Math.floor(baseCount * 0.3);
                const tanks = Math.floor(baseCount * 0.2);
                const flyers = Math.floor(baseCount * 0.2);
                const elites = baseCount - scouts - warriors - tanks - flyers;
                for (let i = 0; i < scouts; i++) {
                    wave.enemies.push({ type: 'scout', healthMult: healthMultiplier });
                }
                for (let i = 0; i < warriors; i++) {
                    wave.enemies.push({ type: 'warrior', healthMult: healthMultiplier });
                }
                for (let i = 0; i < tanks; i++) {
                    wave.enemies.push({ type: 'tank', healthMult: healthMultiplier });
                }
                for (let i = 0; i < flyers; i++) {
                    wave.enemies.push({ type: 'flyer', healthMult: healthMultiplier });
                }
                for (let i = 0; i < elites; i++) {
                    wave.enemies.push({ type: 'elite', healthMult: healthMultiplier });
                }
            }
            // 第18-19波：更多精英
            else if (w <= 19) {
                const warriors = Math.floor(baseCount * 0.3);
                const tanks = Math.floor(baseCount * 0.25);
                const flyers = Math.floor(baseCount * 0.25);
                const elites = baseCount - warriors - tanks - flyers;
                for (let i = 0; i < warriors; i++) {
                    wave.enemies.push({ type: 'warrior', healthMult: healthMultiplier });
                }
                for (let i = 0; i < tanks; i++) {
                    wave.enemies.push({ type: 'tank', healthMult: healthMultiplier });
                }
                for (let i = 0; i < flyers; i++) {
                    wave.enemies.push({ type: 'flyer', healthMult: healthMultiplier });
                }
                for (let i = 0; i < elites; i++) {
                    wave.enemies.push({ type: 'elite', healthMult: healthMultiplier });
                }
            }
            // 第20波：最终Boss波
            else {
                // 大量精英前缀
                for (let i = 0; i < 8; i++) {
                    wave.enemies.push({ type: 'elite', healthMult: healthMultiplier });
                }
                for (let i = 0; i < 10; i++) {
                    wave.enemies.push({ type: 'tank', healthMult: healthMultiplier });
                }
                // 最终Boss
                wave.enemies.push({ type: 'queen', healthMult: healthMultiplier * 2 });
                wave.bonusGold = 500;
            }

            // 随机打乱敌人顺序（除了Boss波）
            if (w !== 10 && w !== 20) {
                this.shuffleArray(wave.enemies);
            }

            waves.push(wave);
        }

        return waves;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startWave() {
        if (this.currentWave >= this.maxWaves) return false;
        if (this.isWaveActive) return false;

        this.currentWave++;
        this.isWaveActive = true;
        this.waveComplete = false;

        // 复制敌人列表
        const waveDef = this.waveDefinitions[this.currentWave - 1];
        this.enemiesToSpawn = waveDef.enemies.map(e => ({ ...e }));
        this.spawnTimer = 0;

        return true;
    }

    update(deltaTime, path, enemies) {
        if (!this.isWaveActive) return;

        // 生成敌人
        this.spawnTimer += deltaTime;

        if (this.enemiesToSpawn.length > 0 && this.spawnTimer >= this.spawnInterval) {
            const enemyData = this.enemiesToSpawn.shift();
            const enemy = new Enemy(enemyData.type, path);

            // 应用血量倍率
            enemy.maxHealth = Math.round(enemy.maxHealth * enemyData.healthMult);
            enemy.health = enemy.maxHealth;

            enemies.push(enemy);
            this.spawnTimer = 0;

            // Boss出现时调整生成间隔
            if (enemyData.type === 'queen') {
                this.spawnInterval = 0.5;
            }
        }

        // 检查波次完成
        if (this.enemiesToSpawn.length === 0 && enemies.every(e => e.isDead)) {
            this.isWaveActive = false;
            this.waveComplete = true;

            if (this.currentWave >= this.maxWaves) {
                this.allWavesComplete = true;
            }
        }
    }

    getBonusGold() {
        if (this.currentWave > 0 && this.currentWave <= this.waveDefinitions.length) {
            return this.waveDefinitions[this.currentWave - 1].bonusGold;
        }
        return 0;
    }

    getEnemyCount() {
        return this.enemiesToSpawn.length;
    }

    getTotalEnemiesInWave() {
        if (this.currentWave > 0 && this.currentWave <= this.waveDefinitions.length) {
            return this.waveDefinitions[this.currentWave - 1].enemies.length;
        }
        return 0;
    }

    getProgress() {
        const total = this.getTotalEnemiesInWave();
        if (total === 0) return 0;
        return (total - this.enemiesToSpawn.length) / total;
    }

    draw(ctx) {
        // 绘制波次信息（可选，由UI系统处理）
    }
}
