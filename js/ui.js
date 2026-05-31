// UI系统

class UI {
    constructor(game) {
        this.game = game;
        this.selectedTowerType = null;
        this.selectedTower = null;

        // 缓存DOM元素
        this.elements = {
            gold: document.getElementById('gold'),
            lives: document.getElementById('lives'),
            wave: document.getElementById('wave'),
            pauseBtn: document.getElementById('pause-btn'),
            towerPanel: document.getElementById('tower-panel'),
            towerSlots: document.querySelectorAll('.tower-slot'),
            startWaveBtn: document.getElementById('start-wave-btn'),
            towerInfoPanel: document.getElementById('tower-info-panel'),
            selectedTowerName: document.getElementById('selected-tower-name'),
            selectedTowerLevel: document.getElementById('selected-tower-level'),
            selectedTowerDamage: document.getElementById('selected-tower-damage'),
            selectedTowerRange: document.getElementById('selected-tower-range'),
            upgradeTowerBtn: document.getElementById('upgrade-tower-btn'),
            upgradeCost: document.getElementById('upgrade-cost'),
            sellTowerBtn: document.getElementById('sell-tower-btn'),
            sellValue: document.getElementById('sell-value'),
            menuScreen: document.getElementById('menu-screen'),
            gameoverScreen: document.getElementById('gameover-screen'),
            gameoverTitle: document.getElementById('gameover-title'),
            gameoverMessage: document.getElementById('gameover-message'),
            finalWave: document.getElementById('final-wave'),
            finalKills: document.getElementById('final-kills'),
            pauseScreen: document.getElementById('pause-screen'),
            startGameBtn: document.getElementById('start-game-btn'),
            restartBtn: document.getElementById('restart-btn'),
            resumeBtn: document.getElementById('resume-btn')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // 开始游戏按钮
        this.elements.startGameBtn.addEventListener('click', () => {
            this.game.startGame();
        });

        // 重新开始按钮
        this.elements.restartBtn.addEventListener('click', () => {
            this.game.restart();
        });

        // 暂停按钮
        this.elements.pauseBtn.addEventListener('click', () => {
            this.game.togglePause();
        });

        // 继续游戏按钮
        this.elements.resumeBtn.addEventListener('click', () => {
            this.game.togglePause();
        });

        // 开始波次按钮
        this.elements.startWaveBtn.addEventListener('click', () => {
            this.game.startWave();
        });

        // 塔选择
        this.elements.towerSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const towerType = slot.dataset.tower;
                this.selectTowerType(towerType);
            });
        });

        // 升级塔
        this.elements.upgradeTowerBtn.addEventListener('click', () => {
            if (this.selectedTower && this.game.upgradeTower(this.selectedTower)) {
                this.updateTowerInfoPanel();
            }
        });

        // 出售塔
        this.elements.sellTowerBtn.addEventListener('click', () => {
            if (this.selectedTower && this.game.sellTower(this.selectedTower)) {
                this.hideTowerInfoPanel();
                this.selectedTower = null;
            }
        });
    }

    selectTowerType(type) {
        const config = TowerTypes[type];
        if (!config) return;

        // 检查是否有足够金币
        if (this.game.gold < config.cost) {
            this.showMessage('金币不足！');
            return;
        }

        // 切换选择状态
        if (this.selectedTowerType === type) {
            this.selectedTowerType = null;
            this.elements.towerSlots.forEach(slot => slot.classList.remove('selected'));
        } else {
            this.selectedTowerType = type;
            this.elements.towerSlots.forEach(slot => {
                slot.classList.toggle('selected', slot.dataset.tower === type);
            });
        }

        // 隐藏塔信息面板
        this.hideTowerInfoPanel();
        this.selectedTower = null;
    }

    selectTower(tower) {
        this.selectedTower = tower;
        this.selectedTowerType = null;
        this.elements.towerSlots.forEach(slot => slot.classList.remove('selected'));
        this.showTowerInfoPanel(tower);
    }

    deselectAll() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.elements.towerSlots.forEach(slot => slot.classList.remove('selected'));
        this.hideTowerInfoPanel();
    }

    showTowerInfoPanel(tower) {
        this.elements.towerInfoPanel.classList.remove('hidden');
        this.updateTowerInfoPanel();
    }

    hideTowerInfoPanel() {
        this.elements.towerInfoPanel.classList.add('hidden');
    }

    updateTowerInfoPanel() {
        if (!this.selectedTower) return;

        const tower = this.selectedTower;
        this.elements.selectedTowerName.textContent = tower.name;
        this.elements.selectedTowerLevel.textContent = `Lv.${tower.level}`;
        this.elements.selectedTowerDamage.textContent = tower.damage;
        this.elements.selectedTowerRange.textContent = tower.range;

        // 升级按钮
        if (tower.level >= tower.maxLevel) {
            this.elements.upgradeTowerBtn.disabled = true;
            this.elements.upgradeCost.textContent = 'MAX';
        } else {
            this.elements.upgradeTowerBtn.disabled = this.game.gold < tower.getUpgradeCost();
            this.elements.upgradeCost.textContent = tower.getUpgradeCost();
        }

        // 出售按钮
        this.elements.sellValue.textContent = tower.getSellValue();
    }

    updateResources() {
        this.elements.gold.textContent = this.game.gold;
        this.elements.lives.textContent = this.game.lives;
        this.elements.wave.textContent = this.game.waveManager.currentWave;

        // 更新塔选择面板的金币状态
        this.elements.towerSlots.forEach(slot => {
            const type = slot.dataset.tower;
            const config = TowerTypes[type];
            if (config) {
                slot.classList.toggle('disabled', this.game.gold < config.cost);
            }
        });
    }

    updateWaveButton() {
        const waveManager = this.game.waveManager;
        this.elements.startWaveBtn.disabled = waveManager.isWaveActive || waveManager.allWavesComplete;

        if (waveManager.isWaveActive) {
            const progress = waveManager.getProgress();
            const remaining = waveManager.getEnemyCount();
            this.elements.startWaveBtn.textContent = `波次进行中 (${Math.round(progress * 100)}%)`;
        } else if (waveManager.allWavesComplete) {
            this.elements.startWaveBtn.textContent = '胜利！';
        } else {
            const bonus = waveManager.getBonusGold();
            this.elements.startWaveBtn.textContent = `开始第 ${waveManager.currentWave + 1} 波 (+${bonus}💰)`;
        }
    }

    showMenu() {
        this.elements.menuScreen.classList.remove('hidden');
        this.elements.gameoverScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
    }

    hideMenu() {
        this.elements.menuScreen.classList.add('hidden');
    }

    showGameOver(isVictory) {
        this.elements.gameoverScreen.classList.remove('hidden');

        if (isVictory) {
            this.elements.gameoverTitle.textContent = '🎉 胜利！🎉';
            this.elements.gameoverTitle.className = 'victory';
            this.elements.gameoverMessage.textContent = '成功保卫了殖民地！';
        } else {
            this.elements.gameoverTitle.textContent = '💀 游戏结束 💀';
            this.elements.gameoverTitle.className = 'defeat';
            this.elements.gameoverMessage.textContent = '殖民地沦陷了...';
        }

        this.elements.finalWave.textContent = this.game.waveManager.currentWave;
        this.elements.finalKills.textContent = this.game.totalKills;
    }

    hideGameOver() {
        this.elements.gameoverScreen.classList.add('hidden');
    }

    showPause() {
        this.elements.pauseScreen.classList.remove('hidden');
    }

    hidePause() {
        this.elements.pauseScreen.classList.add('hidden');
    }

    showMessage(text, duration = 2000) {
        // 创建临时消息
        const msg = document.createElement('div');
        msg.className = 'game-message';
        msg.textContent = text;
        msg.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 15px 30px;
            border-radius: 10px;
            border: 2px solid #4a9eff;
            font-size: 18px;
            z-index: 1000;
            animation: fadeInOut ${duration / 1000}s forwards;
        `;

        // 添加动画样式
        if (!document.getElementById('message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        document.getElementById('ui-overlay').appendChild(msg);

        setTimeout(() => {
            msg.remove();
        }, duration);
    }

    update() {
        this.updateResources();
        this.updateWaveButton();
        this.updateTowerInfoPanel();
    }
}
