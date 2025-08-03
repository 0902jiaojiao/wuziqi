// 五子棋AI网页版JavaScript代码
class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15;
        this.cellSize = this.canvas.width / this.boardSize;
        this.gameId = null;
        this.board = [];
        this.currentPlayer = 1; // 1: 玩家(黑子), 2: AI(白子)
        this.gameOver = false;
        this.winner = null;
        this.hintMove = null;
        this.hintsRemaining = 1;
        this.isProcessing = false;
        this.lastAiMove = null; // 记录AI的最新落子位置
        this.serverUrl = window.location.origin; // 使用当前网站的域名
        
        this.initializeBoard();
        this.setupEventListeners();
        this.drawBoard();
        this.createNewGame();
    }

    // 初始化棋盘
    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }

    // 设置事件监听器
    setupEventListeners() {
        // 棋盘点击事件
        this.canvas.addEventListener('click', (e) => this.handleBoardClick(e));
        
        // 按钮事件
        document.getElementById('newGameBtn').addEventListener('click', () => this.createNewGame());
        document.getElementById('resetGameBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('getHintBtn').addEventListener('click', () => this.getHint());
        document.getElementById('syncBtn').addEventListener('click', () => this.syncGameState());
        
        // 弹窗事件
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newGameFromModal').addEventListener('click', () => {
            this.closeModal();
            this.createNewGame();
        });
        
        // 设置变更事件
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            if (!this.gameOver) {
                this.showToast('游戏结束后可调整难度', 2000);
            }
        });
    }

    // 获取鼠标点击位置对应的棋盘坐标
    getBoardPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.round(x / this.cellSize - 0.5);
        const row = Math.round(y / this.cellSize - 0.5);
        
        return { row, col };
    }

    // 处理棋盘点击
    async handleBoardClick(e) {
        if (this.isProcessing || this.gameOver || this.currentPlayer !== 1) {
            if (this.isProcessing) {
                this.showToast('请等待AI思考完成', 1000);
            }
            return;
        }

        const { row, col } = this.getBoardPosition(e);
        
        if (row < 0 || row >= this.boardSize || col < 0 || col >= this.boardSize) {
            return;
        }

        if (this.board[row][col] !== 0) {
            this.showToast('该位置已有棋子', 1500);
            return;
        }

        // 添加点击反馈效果
        this.showClickFeedback(row, col);
        
        await this.makeMove(row, col);
    }

    // 显示点击反馈效果
    showClickFeedback(row, col) {
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        
        // 创建临时点击效果
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

    // 玩家落子
    async makeMove(row, col) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.clearHint();
        // 用户落子时清除上一次AI高亮，让新的AI落子更明显
        this.lastAiMove = null;
        
        // 立即显示玩家棋子，提升响应速度
        const originalPiece = this.board[row][col];
        this.board[row][col] = 1;
        this.drawBoard();
        this.updateStatus('AI正在思考...', true);

        try {
            const difficulty = parseInt(document.getElementById('difficultySelect').value);
            const speed = parseInt(document.getElementById('speedSelect').value);
            
            const response = await fetch(`${this.serverUrl}/api/make_move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: this.gameId,
                    row: row,
                    col: col,
                    difficulty: difficulty,
                    ai_speed: speed
                }),
                timeout: 30000
            });

            const result = await response.json();

            if (!response.ok) {
                // 恢复原始状态
                this.board[row][col] = originalPiece;
                this.drawBoard();
                throw new Error(result.message || result.error || '网络请求失败');
            }

            // 记录AI最新落子位置
            if (result.ai_move) {
                this.lastAiMove = {
                    row: result.ai_move.row,
                    col: result.ai_move.col
                };
            }

            // 更新完整游戏状态
            this.updateGameState(result.board_state);

            // 检查游戏是否结束
            if (result.board_state.game_over) {
                this.handleGameOver(result.board_state.winner);
            } else {
                // 显示AI落子高亮
                if (result.ai_move) {
                    const thinkingTime = result.ai_thinking_time || 0;
                    setTimeout(() => {
                        this.showAiMoveHighlight(
                            result.ai_move.row, 
                            result.ai_move.col, 
                            thinkingTime.toFixed(1)
                        );
                    }, 300);
                }
            }

        } catch (error) {
            console.error('落子失败:', error);
            
            // 恢复原始状态
            this.board[row][col] = originalPiece;
            this.drawBoard();
            
            this.showToast(`落子失败：${error.message}`, 3000);
            
            // 尝试同步状态
            setTimeout(() => {
                this.syncGameState();
            }, 1000);
        } finally {
            this.isProcessing = false;
            this.updateStatus();
        }
    }

    // 更新游戏状态
    updateGameState(boardState) {
        this.board = boardState.board;
        this.currentPlayer = boardState.current_player;
        this.gameOver = boardState.game_over;
        this.winner = boardState.winner;
        
        this.drawBoard();
        this.updateStatus();
    }

    // 更新状态显示
    updateStatus(customMessage = '', showThinking = false) {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameResultElement = document.getElementById('gameResult');
        const thinkingElement = document.getElementById('thinkingStatus');
        
        if (customMessage) {
            thinkingElement.textContent = customMessage;
            return;
        }
        
        thinkingElement.textContent = '';
        
        if (this.gameOver) {
            gameResultElement.textContent = this.getWinnerText();
            currentPlayerElement.textContent = '游戏结束';
        } else {
            gameResultElement.textContent = '';
            if (this.currentPlayer === 1) {
                currentPlayerElement.textContent = '玩家 (黑子)';
            } else {
                currentPlayerElement.textContent = 'AI (白子)';
                if (showThinking) {
                    thinkingElement.textContent = 'AI正在思考...';
                }
            }
        }
    }

    // 获取获胜者文本
    getWinnerText() {
        if (this.winner === 1) {
            return '🎉 恭喜！玩家获胜！';
        } else if (this.winner === 2) {
            return '🤖 AI获胜！再接再厉！';
        } else {
            return '🤝 平局！';
        }
    }

    // 处理游戏结束
    handleGameOver(winner) {
        this.gameOver = true;
        this.winner = winner;
        this.updateStatus();
        
        setTimeout(() => {
            this.showGameOverModal();
        }, 1000);
    }

    // 显示游戏结束弹窗
    showGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        const gameOverText = document.getElementById('gameOverText');
        
        gameOverText.textContent = this.getWinnerText();
        modal.style.display = 'flex';
    }

    // 关闭弹窗
    closeModal() {
        document.getElementById('gameOverModal').style.display = 'none';
    }

    // 创建新游戏
    async createNewGame() {
        try {
            this.updateStatus('创建新游戏...', true);
            
            const difficulty = parseInt(document.getElementById('difficultySelect').value);
            
            const response = await fetch(`${this.serverUrl}/api/new_game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    difficulty: difficulty
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '创建游戏失败');
            }

            this.gameId = result.game_id;
            this.hintsRemaining = 1;
            this.lastAiMove = null; // 重置AI落子标记
            this.updateHintsDisplay();
            this.updateGameState(result.board_state);
            this.closeModal();
            
            this.showToast('新游戏创建成功！', 2000);

        } catch (error) {
            console.error('创建新游戏失败:', error);
            this.showToast(`创建新游戏失败：${error.message}`, 3000);
        }
    }

    // 重置游戏
    async resetGame() {
        if (!this.gameId) {
            this.createNewGame();
            return;
        }

        try {
            this.updateStatus('重置游戏...', true);
            
            const response = await fetch(`${this.serverUrl}/api/reset_game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: this.gameId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '重置游戏失败');
            }

            this.hintsRemaining = result.hints_remaining || 1;
            this.lastAiMove = null; // 重置AI落子标记
            this.updateHintsDisplay();
            this.updateGameState(result.board_state);
            this.closeModal();
            
            this.showToast('游戏重置成功！', 2000);

        } catch (error) {
            console.error('重置游戏失败:', error);
            this.showToast(`重置游戏失败：${error.message}`, 3000);
        }
    }

    // 获取AI提示
    async getHint() {
        if (this.hintsRemaining <= 0) {
            this.showToast('每局游戏只能使用一次提示', 2000);
            return;
        }

        if (this.currentPlayer !== 1 || this.gameOver) {
            this.showToast('当前无法使用提示', 1500);
            return;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/ai_hint?game_id=${this.gameId}`);
            const result = await response.json();

            if (!response.ok) {
                if (result.error === 'hint_already_used') {
                    this.hintsRemaining = 0;
                    this.updateHintsDisplay();
                    this.showToast('每局游戏只能使用一次提示', 2000);
                } else {
                    throw new Error(result.message || '获取提示失败');
                }
                return;
            }

            this.hintMove = result.hint_move;
            this.hintsRemaining = result.hints_remaining || 0;
            this.updateHintsDisplay();
            this.drawBoard();
            
            this.showToast(`AI建议位置已标出（剩余${this.hintsRemaining}次）`, 2500);

        } catch (error) {
            console.error('获取提示失败:', error);
            this.showToast(`获取提示失败：${error.message}`, 3000);
        }
    }

    // 同步游戏状态
    async syncGameState() {
        if (!this.gameId) {
            this.showToast('请先创建游戏', 1500);
            return;
        }

        try {
            this.updateStatus('同步游戏状态...', true);
            
            const response = await fetch(`${this.serverUrl}/api/get_board_state?game_id=${this.gameId}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '同步失败');
            }

            this.updateGameState(result.board_state);
            this.showToast('游戏状态同步成功', 1500);

        } catch (error) {
            console.error('同步游戏状态失败:', error);
            this.showToast(`同步失败：${error.message}`, 3000);
        }
    }

    // 清除提示
    clearHint() {
        this.hintMove = null;
        this.drawBoard();
    }

    // 更新提示次数显示
    updateHintsDisplay() {
        document.getElementById('hintsRemaining').textContent = this.hintsRemaining;
        const hintBtn = document.getElementById('getHintBtn');
        hintBtn.disabled = this.hintsRemaining <= 0 || this.currentPlayer !== 1 || this.gameOver;
    }

    // 显示AI落子高亮
    showAiMoveHighlight(row, col, thinkingTime) {
        const highlight = document.getElementById('aiMoveHighlight');
        highlight.textContent = `AI落子: (${row+1}, ${col+1}) [思考${thinkingTime}秒]`;
        highlight.style.display = 'block';
        
        setTimeout(() => {
            highlight.style.display = 'none';
        }, 3000);
    }

    // 显示自定义Toast
    showToast(text, duration = 2000) {
        const toast = document.getElementById('customToast');
        toast.textContent = text;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    }

    // 绘制棋盘
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
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
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

    // 绘制棋子
    drawPiece(row, col, player) {
        const ctx = this.ctx;
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        const radius = this.cellSize * 0.4;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (player === 1) {
            // 黑子
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (player === 2) {
            // 白子
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // 绘制提示
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

    // 绘制AI最新落子高亮
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
    new GomokuGame();
});