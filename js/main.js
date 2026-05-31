// 游戏入口和主循环

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 星际防线 - Starfall Defense');
    console.log('正在初始化游戏...');

    // 获取画布
    const canvas = document.getElementById('game-canvas');

    if (!canvas) {
        console.error('找不到游戏画布！');
        return;
    }

    // 设置画布尺寸
    canvas.width = GameConstants.CANVAS_WIDTH;
    canvas.height = GameConstants.CANVAS_HEIGHT;

    // 创建游戏实例
    const game = new Game(canvas);

    // 启动游戏循环
    console.log('游戏初始化完成，开始运行...');
    game.gameLoop(0);

    // 显示开始菜单
    game.ui.showMenu();

    console.log('游戏已就绪！');
    console.log('提示：');
    console.log('- 数字键 1-5 快速选择防御塔');
    console.log('- 空格键或 P 键暂停游戏');
    console.log('- ESC 键取消选择');
    console.log('- 右键取消当前选择');
    console.log('- F1 键切换调试模式');
    console.log('- F2 键显示游戏状态');

    // 调试快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            DebugTools.toggle();
        }
        if (e.key === 'F2') {
            e.preventDefault();
            DebugTools.showStats(game);
        }
    });
});
