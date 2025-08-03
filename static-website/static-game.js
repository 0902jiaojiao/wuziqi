/**
 * 五子棋AI静态版本 - 主游戏控制器
 * 基于原始website/script.js改写，移除后端依赖
 */

class StaticGomokuGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = this.canvas.width / this.boardSize;
        
        // 游戏状态
        this.game = new GomokuGame(this.boardSize);
        this.ai = new GomokuAI(3); // 默认困难难度
        this.hintMove = null;
        this.hintsRemaining = 1;
        this.isProcessing = false;
        this.lastAiMove = null;
        this.moveHistory = []; // 用于悔棋功能
        
        this.initializeEventListeners();
        this.drawBoard();
        this.updateStatus();
        this.showToast('游戏已就绪！点击棋盘开始游戏', 2000);
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 棋盘点击事件
        this.canvas.addEventListener('click', (e) => this.handleBoardClick(e));
        
        // 按钮事件
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetGameBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('getHintBtn').addEventListener('click', () => this.getHint());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        
        // 弹窗事件
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newGameFromModal').addEventListener('click', () => {
            this.closeModal();
            this.newGame();
        });
        
        // 设置变更事件
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            const difficulty = parseInt(e.target.value);
            this.ai = new GomokuAI(difficulty);
            this.showToast(`难度已调整为: ${this.getDifficultyText(difficulty)}`, 1500);
        });

        document.getElementById('speedSelect').addEventListener('change', (e) => {
            const speed = parseInt(e.target.value);
            this.showToast(`AI速度已调整为: ${this.getSpeedText(speed)}`, 1500);
        });
    }

    /**
     * 获取难度文本
     */
    getDifficultyText(difficulty) {
        const difficultyMap = {1: '简单', 2: '普通', 3: '困难', 4: '专家', 5: '大师'};
        return difficultyMap[difficulty] || '困难';
    }

    /**
     * 获取速度文本
     */
    getSpeedText(speed) {
        const speedMap = {0: '极速', 1: '快速', 2: '普通', 3: '慢速', 4: '深思'};
        return speedMap[speed] || '普通';
    }

    /**
     * 获取鼠标点击位置对应的棋盘坐标
     */
    getBoardPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round(x / this.cellSize - 0.5);
        const row = Math.round(y / this.cellSize - 0.5);
        
        return { row, col };
    }

    /**
     * 处理棋盘点击
     */
    async handleBoardClick(e) {
        if (this.isProcessing || this.game.gameOver || this.game.currentPlayer !== 1) {
            if (this.isProcessing) {
                this.showToast('请等待AI思考完成', 1000);
            }
            return;
        }

        const { row, col } = this.getBoardPosition(e);
        
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return;
        }

        if (!this.game.isValidMove(row, col)) {
            this.showToast('该位置已有棋子', 1500);
            return;
        }

        // 添加点击反馈效果
        this.showClickFeedback(row, col);
        
        await this.makePlayerMove(row, col);
    }

    /**
     * 显示点击反馈效果
     */
    showClickFeedback(row, col) {
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        
        const ctx = this.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, this.cellSize * 0.2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        ctx.fill();
        ctx.restore();
        
        // 50ms后重绘棋盘清除效果
        setTimeout(() => {
            this.drawBoard();
        }, 50);
    }

    /**
     * 玩家落子
     */
    async makePlayerMove(row, col) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.clearHint();
        this.lastAiMove = null; // 清除AI高亮
        
        // 保存状态用于悔棋
        this.saveGameState();
        
        // 立即显示玩家棋子
        this.game.makeMove(row, col, 1);
        this.drawBoard();
        
        // 检查玩家是否获胜
        if (this.game.gameOver) {
            this.handleGameOver();
            this.isProcessing = false;
            return;
        }
        
        // 切换到AI回合
        this.updateStatus('AI正在思考...', true);
        
        // 添加AI思考延迟
        const speed = parseInt(document.getElementById('speedSelect').value);
        const thinkingTime = this.getAIThinkingTime(speed);
        
        setTimeout(async () => {
            await this.makeAIMove();
            this.isProcessing = false;
        }, thinkingTime);
    }

    /**
     * 获取AI思考时间
     */
    getAIThinkingTime(speed) {
        const timeMap = {0: 100, 1: 300, 2: 800, 3: 1500, 4: 2500};
        return timeMap[speed] || 800;
    }

    /**
     * AI落子
     */
    async makeAIMove() {
        const startTime = Date.now();
        
        try {
            // 获取AI最佳落子
            const aiMove = this.ai.getBestMove(this.game);
            
            if (!aiMove) {
                this.showToast('AI无法找到有效落子位置', 2000);
                this.updateStatus();
                return;
            }

            const [row, col] = aiMove;
            
            // AI落子
            this.game.makeMove(row, col, 2);
            this.lastAiMove = { row, col };
            this.drawBoard();
            
            // 显示AI落子信息
            const thinkingTime = (Date.now() - startTime) / 1000;
            this.showAiMoveHighlight(row, col, thinkingTime.toFixed(1));
            
            // 检查游戏是否结束
            if (this.game.gameOver) {
                this.handleGameOver();
            } else {
                this.updateStatus();
            }
            
        } catch (error) {
            console.error('AI落子失败:', error);
            this.showToast('AI思考出错，请重试', 2000);
            this.updateStatus();
        }
    }

    /**
     * 保存游戏状态（用于悔棋）
     */
    saveGameState() {
        this.moveHistory.push({
            board: this.game.board.map(row => [...row]),
            currentPlayer: this.game.currentPlayer,
            gameOver: this.game.gameOver,
            winner: this.game.winner,
            lastAiMove: this.lastAiMove ? {...this.lastAiMove} : null
        });
    }

    /**
     * 悔棋功能
     */
    undoMove() {
        if (this.moveHistory.length === 0) {
            this.showToast('没有可以悔棋的步骤', 1500);
            return;
        }

        if (this.isProcessing) {
            this.showToast('AI思考中，无法悔棋', 1500);
            return;
        }

        // 恢复上一个状态
        const lastState = this.moveHistory.pop();
        this.game.board = lastState.board;
        this.game.currentPlayer = lastState.currentPlayer;
        this.game.gameOver = lastState.gameOver;
        this.game.winner = lastState.winner;
        this.lastAiMove = lastState.lastAiMove;
        
        this.clearHint();
        this.drawBoard();
        this.updateStatus();
        this.showToast('悔棋成功', 1000);
    }

    /**
     * 新游戏
     */
    newGame() {
        this.game.resetGame();
        this.moveHistory = [];
        this.hintsRemaining = 1;
        this.lastAiMove = null;
        this.clearHint();
        this.updateHintsDisplay();
        this.drawBoard();
        this.updateStatus();
        this.closeModal();
        this.showToast('新游戏开始！', 1500);
    }

    /**
     * 重置游戏
     */
    resetGame() {
        this.newGame();
    }

    /**
     * 获取AI提示
     */
    async getHint() {
        if (this.hintsRemaining <= 0) {
            this.showToast('每局游戏只能使用一次提示', 2000);
            return;
        }

        if (this.game.currentPlayer !== 1 || this.game.gameOver) {
            this.showToast('当前无法使用提示', 1500);
            return;
        }

        try {
            // 使用AI算法获取最佳落子位置作为提示
            const hintMove = this.ai.getBestMove(this.game);
            
            if (!hintMove) {
                this.showToast('无法获取有效提示', 2000);
                return;
            }

            this.hintMove = { row: hintMove[0], col: hintMove[1] };
            this.hintsRemaining = 0;
            this.updateHintsDisplay();
            this.drawBoard();
            
            this.showToast('AI建议位置已标出', 2500);

        } catch (error) {
            console.error('获取提示失败:', error);
            this.showToast('获取提示失败，请重试', 2000);
        }
    }

    /**
     * 更新状态显示
     */
    updateStatus(customMessage = '', showThinking = false) {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameResultElement = document.getElementById('gameResult');
        const thinkingElement = document.getElementById('thinkingStatus');
        
        if (customMessage) {
            thinkingElement.textContent = customMessage;
            return;
        }
        
        thinkingElement.textContent = '';
        
        if (this.game.gameOver) {
            gameResultElement.textContent = this.getWinnerText();
            currentPlayerElement.textContent = '游戏结束';
        } else {
            gameResultElement.textContent = '';
            if (this.game.currentPlayer === 1) {
                currentPlayerElement.textContent = '玩家 (黑子)';
            } else {
                currentPlayerElement.textContent = 'AI (白子)';
                if (showThinking) {
                    thinkingElement.textContent = 'AI正在思考...';
                }
            }
        }
    }

    /**
     * 获取获胜者文本
     */
    getWinnerText() {
        if (this.game.winner === 1) {
            return '恭喜！玩家获胜！';
        } else if (this.game.winner === 2) {
            return 'AI获胜！再接再厉！';
        } else {
            return '平局！';
        }
    }

    /**
     * 处理游戏结束
     */
    handleGameOver() {
        this.updateStatus();
        
        setTimeout(() => {
            this.showGameOverModal();
        }, 1000);
    }

    /**
     * 显示游戏结束弹窗
     */
    showGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        const gameOverText = document.getElementById('gameOverText');
        
        gameOverText.textContent = this.getWinnerText();
        modal.style.display = 'flex';
    }

    /**
     * 关闭弹窗
     */
    closeModal() {
        document.getElementById('gameOverModal').style.display = 'none';
    }

    /**
     * 清除提示
     */
    clearHint() {
        this.hintMove = null;
        this.drawBoard();
    }

    /**
     * 更新提示次数显示
     */
    updateHintsDisplay() {
        document.getElementById('hintsRemaining').textContent = this.hintsRemaining;
        const hintBtn = document.getElementById('getHintBtn');
        hintBtn.disabled = this.hintsRemaining <= 0 || this.game.currentPlayer !== 1 || this.game.gameOver;
    }

    /**
     * 显示AI落子高亮
     */
    showAiMoveHighlight(row, col, thinkingTime) {
        const highlight = document.getElementById('aiMoveHighlight');
        highlight.textContent = `AI落子: (${row+1}, ${col+1}) [思考${thinkingTime}秒]`;
        highlight.style.display = 'block';
        
        setTimeout(() => {
            highlight.style.display = 'none';
        }, 3000);
    }

    /**
     * 显示自定义Toast
     */
    showToast(text, duration = 2000) {
        const toast = document.getElementById('customToast');
        toast.textContent = text;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    }

    /**
     * 绘制棋盘
     */
    drawBoard() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        
        // 清空画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制棋盘背景
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格线
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(cellSize * (i + 0.5), cellSize * 0.5);
            ctx.lineTo(cellSize * (i + 0.5), cellSize * (this.boardSize - 0.5));
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(cellSize * 0.5, cellSize * (i + 0.5));
            ctx.lineTo(cellSize * (this.boardSize - 0.5), cellSize * (i + 0.5));
            ctx.stroke();
        }
        
        // 绘制天元点
        const center = Math.floor(this.boardSize / 2);
        const points = [
            [center, center],
            [3, 3], [3, center], [3, this.boardSize - 4],
            [center, 3], [center, this.boardSize - 4],
            [this.boardSize - 4, 3], [this.boardSize - 4, center], [this.boardSize - 4, this.boardSize - 4]
        ];
        
        ctx.fillStyle = '#8b4513';
        points.forEach(([row, col]) => {
            ctx.beginPath();
            ctx.arc(cellSize * (col + 0.5), cellSize * (row + 0.5), 3, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // 绘制棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.game.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.game.board[row][col]);
                }
            }
        }
        
        // 绘制提示
        if (this.hintMove) {
            this.drawHint(this.hintMove.row, this.hintMove.col);
        }
        
        // 绘制AI最新落子高亮
        if (this.lastAiMove) {
            this.drawLastAiMove(this.lastAiMove.row, this.lastAiMove.col);
        }
    }

    /**
     * 绘制棋子 - 立体效果
     */
    drawPiece(row, col, player) {
        const ctx = this.ctx;
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        const radius = this.cellSize * 0.4;
        
        ctx.save();
        
        if (player === 1) {
            // 黑子 - 立体效果
            // 底部阴影
            ctx.beginPath();
            ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fill();
            
            // 主体黑子渐变
            const gradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            gradient.addColorStop(0, '#4a4a4a');
            gradient.addColorStop(0.7, '#1a1a1a');
            gradient.addColorStop(1, '#000000');
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 高光效果
            ctx.beginPath();
            ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fill();
            
            // 边框
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.stroke();
            
        } else if (player === 2) {
            // 白子 - 立体效果
            // 底部阴影
            ctx.beginPath();
            ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fill();
            
            // 主体白子渐变
            const gradient = ctx.createRadialGradient(
                x - radius * 0.3, y - radius * 0.3, 0,
                x, y, radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, '#f0f0f0');
            gradient.addColorStop(1, '#d0d0d0');
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 高光效果
            ctx.beginPath();
            ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.25, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            
            // 边框
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#999999';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    /**
     * 绘制提示
     */
    drawHint(row, col) {
        const ctx = this.ctx;
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        const radius = this.cellSize * 0.3;
        
        // 绘制提示圆圈
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 绘制提示文字
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('提示', x, y);
    }

    /**
     * 绘制AI最新落子高亮
     */
    drawLastAiMove(row, col) {
        const ctx = this.ctx;
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        const radius = this.cellSize * 0.45;
        
        // 绘制呼吸效果的外圈
        const time = Date.now() / 1000;
        const pulseRadius = radius + Math.sin(time * 3) * 3;
        
        ctx.save();
        
        // 外圈 - 蓝色呼吸效果
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 内圈 - 固定蓝色圆圈
        ctx.beginPath();
        ctx.arc(x, y, radius - 5, 0, 2 * Math.PI);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制标识文字
        ctx.fillStyle = '#2980b9';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AI', x, y);
        
        ctx.restore();
        
        // 安排下次重绘以实现动画效果
        setTimeout(() => {
            if (this.lastAiMove && this.lastAiMove.row === row && this.lastAiMove.col === col) {
                this.drawBoard();
            }
        }, 100);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new StaticGomokuGame();
});