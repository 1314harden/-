// 地图系统

class GameMap {
    constructor() {
        this.grid = [];
        this.path = [];
        this.pathPoints = [];
        this.initGrid();
        this.initPath();
    }

    initGrid() {
        // 初始化网格 (0 = 可建造, 1 = 路径, 2 = 不可建造)
        for (let row = 0; row < GRID_ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < GRID_COLS; col++) {
                this.grid[row][col] = 0; // 默认可建造
            }
        }

        // 标记UI区域为不可建造
        for (let col = 0; col < GRID_COLS; col++) {
            this.grid[GRID_ROWS - 1][col] = 2;
            this.grid[GRID_ROWS - 2][col] = 2;
        }
        for (let col = 0; col < GRID_COLS; col++) {
            this.grid[0][col] = 2;
        }
    }

    initPath() {
        // 定义路径点（起点 -> 终点）
        // 创建一个有趣的S形路径
        this.pathPoints = [
            { x: 0, y: 200 },
            { x: 200, y: 200 },
            { x: 200, y: 100 },
            { x: 400, y: 100 },
            { x: 400, y: 300 },
            { x: 300, y: 300 },
            { x: 300, y: 400 },
            { x: 500, y: 400 },
            { x: 500, y: 200 },
            { x: 700, y: 200 },
            { x: 700, y: 450 },
            { x: 600, y: 450 },
            { x: 600, y: 550 },
            { x: 900, y: 550 },
            { x: 900, y: 350 },
            { x: 800, y: 350 },
            { x: 800, y: 200 },
            { x: 1000, y: 200 }
        ];

        // 根据路径点标记网格
        this.markPathOnGrid();

        // 生成详细路径点（用于敌人移动）
        this.generateDetailedPath();
    }

    markPathOnGrid() {
        // 在路径周围标记不可建造区域
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];

            // 标记路径上的网格
            const startX = Math.min(p1.x, p2.x);
            const endX = Math.max(p1.x, p2.x);
            const startY = Math.min(p1.y, p2.y);
            const endY = Math.max(p1.y, p2.y);

            for (let x = startX - TILE_SIZE; x <= endX + TILE_SIZE; x += TILE_SIZE) {
                for (let y = startY - TILE_SIZE; y <= endY + TILE_SIZE; y += TILE_SIZE) {
                    const col = Math.floor(x / TILE_SIZE);
                    const row = Math.floor(y / TILE_SIZE);

                    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
                        // 检查是否在路径上（宽度约40像素）
                        if (this.isOnPath(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 25)) {
                            this.grid[row][col] = 1; // 路径
                        }
                    }
                }
            }
        }
    }

    isOnPath(x, y, threshold = 20) {
        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];

            if (this.distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < threshold) {
                return true;
            }
        }
        return false;
    }

    distanceToSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return Utils.distance(px, py, xx, yy);
    }

    generateDetailedPath() {
        // 生成更细致的路径点供敌人使用
        this.detailedPath = [];

        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];

            const dist = Utils.distance(p1.x, p1.y, p2.x, p2.y);
            const steps = Math.ceil(dist / 5);

            for (let j = 0; j < steps; j++) {
                const t = j / steps;
                this.detailedPath.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
            }
        }

        // 添加终点
        this.detailedPath.push(this.pathPoints[this.pathPoints.length - 1]);
    }

    canBuild(row, col) {
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
            return false;
        }
        return this.grid[row][col] === 0;
    }

    isPath(row, col) {
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
            return false;
        }
        return this.grid[row][col] === 1;
    }

    draw(ctx) {
        // 绘制背景
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 绘制星空背景
        this.drawStars(ctx);

        // 绘制网格
        this.drawGrid(ctx);

        // 绘制路径
        this.drawPath(ctx);

        // 绘制起点和终点
        this.drawEndpoints(ctx);
    }

    drawStars(ctx) {
        // 使用固定种子生成星星，避免每帧重新生成
        if (!this.stars) {
            this.stars = [];
            for (let i = 0; i < 100; i++) {
                this.stars.push({
                    x: Math.random() * CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT,
                    size: Math.random() * 2 + 0.5,
                    brightness: Math.random()
                });
            }
        }

        const time = Date.now() * 0.001;
        for (const star of this.stars) {
            const alpha = 0.3 + Math.sin(time + star.brightness * 10) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(74, 158, 255, 0.1)';
        ctx.lineWidth = 1;

        // 绘制网格线
        for (let row = 0; row <= GRID_ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * TILE_SIZE);
            ctx.lineTo(CANVAS_WIDTH, row * TILE_SIZE);
            ctx.stroke();
        }

        for (let col = 0; col <= GRID_COLS; col++) {
            ctx.beginPath();
            ctx.moveTo(col * TILE_SIZE, 0);
            ctx.lineTo(col * TILE_SIZE, CANVAS_HEIGHT);
            ctx.stroke();
        }

        // 高亮可建造区域
        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                if (this.grid[row][col] === 0) {
                    ctx.fillStyle = 'rgba(74, 255, 74, 0.05)';
                    ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    drawPath(ctx) {
        // 绘制路径底色
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 40;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
        for (let i = 1; i < this.pathPoints.length; i++) {
            ctx.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
        }
        ctx.stroke();

        // 绘制路径发光效果
        ctx.strokeStyle = '#3a3a6a';
        ctx.lineWidth = 30;
        ctx.stroke();

        // 绘制路径中心线
        ctx.strokeStyle = '#4a4a8a';
        ctx.lineWidth = 20;
        ctx.stroke();

        // 绘制路径箭头指示方向
        this.drawPathArrows(ctx);
    }

    drawPathArrows(ctx) {
        ctx.fillStyle = '#6a6aaa';

        for (let i = 0; i < this.pathPoints.length - 1; i++) {
            const p1 = this.pathPoints[i];
            const p2 = this.pathPoints[i + 1];
            const dist = Utils.distance(p1.x, p1.y, p2.x, p2.y);

            // 每隔一定距离绘制箭头
            for (let d = 50; d < dist; d += 100) {
                const t = d / dist;
                const x = p1.x + (p2.x - p1.x) * t;
                const y = p1.y + (p2.y - p1.y) * t;
                const angle = Utils.angle(p1.x, p1.y, p2.x, p2.y);

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);

                ctx.beginPath();
                ctx.moveTo(8, 0);
                ctx.lineTo(-4, -5);
                ctx.lineTo(-4, 5);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }
        }
    }

    drawEndpoints(ctx) {
        // 起点
        const start = this.pathPoints[0];
        ctx.fillStyle = '#4aff4a';
        ctx.beginPath();
        ctx.arc(start.x, start.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', start.x, start.y);

        // 终点
        const end = this.pathPoints[this.pathPoints.length - 1];
        ctx.fillStyle = '#ff4a4a';
        ctx.beginPath();
        ctx.arc(end.x, end.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.fillText('E', end.x, end.y);

        // 绘制终点基地
        ctx.fillStyle = 'rgba(255, 74, 74, 0.3)';
        ctx.beginPath();
        ctx.arc(end.x, end.y, 35, 0, Math.PI * 2);
        ctx.fill();
    }

    getGridPosition(x, y) {
        return {
            row: Math.floor(y / TILE_SIZE),
            col: Math.floor(x / TILE_SIZE)
        };
    }

    getPixelPosition(row, col) {
        return {
            x: col * TILE_SIZE + TILE_SIZE / 2,
            y: row * TILE_SIZE + TILE_SIZE / 2
        };
    }
}
