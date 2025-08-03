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

    // 3D棋子落下动画
    animate3DPieceDrop(row, col, player, callback) {
        const startTime = Date.now();
        const duration = 600; // 动画持续时间
        const dropHeight = this.cellSize * 1.5; // 掉落高度
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 弹跳缓动函数
            const easeOutBounce = (t) => {
                if (t < (1/2.75)) {
                    return 7.5625 * t * t;
                } else if (t < (2/2.75)) {
                    return 7.5625 * (t -= (1.5/2.75)) * t + 0.75;
                } else if (t < (2.5/2.75)) {
                    return 7.5625 * (t -= (2.25/2.75)) * t + 0.9375;
                } else {
                    return 7.5625 * (t -= (2.625/2.75)) * t + 0.984375;
                }
            };
            
            const bounceProgress = easeOutBounce(progress);
            
            // 重绘棋盘
            this.drawBoard();
            
            // 绘制掉落中的棋子
            const ctx = this.ctx;
            const x = this.cellSize * (col + 0.5);
            const baseY = this.cellSize * (row + 0.5);
            const currentY = baseY - dropHeight * (1 - bounceProgress);
            const radius = this.cellSize * 0.42;
            
            // 旋转效果
            const rotation = progress * Math.PI * 2;
            
            ctx.save();
            
            // 棋子阴影渐现
            if (progress > 0.5) {
                const shadowOpacity = (progress - 0.5) * 2 * 0.4;
                const shadowGradient = ctx.createRadialGradient(x + 3, baseY + 3, 0, x + 3, baseY + 3, radius + 5);
                shadowGradient.addColorStop(0, `rgba(0, 0, 0, ${shadowOpacity})`);
                shadowGradient.addColorStop(0.5, `rgba(0, 0, 0, ${shadowOpacity * 0.5})`);
                shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = shadowGradient;
                ctx.beginPath();
                ctx.arc(x + 3, baseY + 3, radius + 5, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            // 应用旋转变换
            ctx.translate(x, currentY);
            ctx.rotate(rotation);
            ctx.translate(-x, -currentY);
            
            // 绘制正在掉落的棋子
            if (player === 1) {
                this.draw3DBlackPiece(x, currentY, radius);
            } else {
                this.draw3DWhitePiece(x, currentY, radius);
            }
            
            // 掉落轨迹效果
            if (progress < 0.8) {
                const trailOpacity = (0.8 - progress) * 0.3;
                const trailGradient = ctx.createLinearGradient(x, currentY - 20, x, currentY + 20);
                trailGradient.addColorStop(0, player === 1 ? `rgba(0, 0, 0, ${trailOpacity})` : `rgba(255, 255, 255, ${trailOpacity})`);
                trailGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = trailGradient;
                ctx.fillRect(x - 3, currentY - 20, 6, 40);
            }
            
            ctx.restore();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成，正常绘制棋盘
                this.drawBoard();
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    }

    // 玩家落子
    async makeMove(row, col) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.clearHint();
        // 用户落子时清除上一次AI高亮，让新的AI落子更明显
        this.lastAiMove = null;
        
        // 播放玩家棋子3D落下动画
        const originalPiece = this.board[row][col];
        this.animate3DPieceDrop(row, col, 1, () => {
            // 动画完成后设置棋子
            this.board[row][col] = 1;
            this.drawBoard();
        });
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

            // 播放AI棋子3D落下动画（如果有AI移动）
            if (result.ai_move) {
                // 先更新除AI落子位置外的游戏状态
                const tempBoard = [...result.board_state.board.map(row => [...row])];
                tempBoard[result.ai_move.row][result.ai_move.col] = 0; // 临时清除AI棋子
                this.updateGameState({...result.board_state, board: tempBoard});
                
                // 播放AI落子动画
                setTimeout(() => {
                    this.animate3DPieceDrop(result.ai_move.row, result.ai_move.col, 2, () => {
                        // 动画完成后更新完整状态
                        this.updateGameState(result.board_state);
                        
                        // 检查游戏是否结束
                        if (result.board_state.game_over) {
                            this.handleGameOver(result.board_state.winner);
                        }
                    });
                }, 300);
            } else {
                // 没有AI移动，直接更新状态
                this.updateGameState(result.board_state);
                
                // 检查游戏是否结束
                if (result.board_state.game_over) {
                    this.handleGameOver(result.board_state.winner);
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
            return '恭喜！玩家获胜！';
        } else if (this.winner === 2) {
            return 'AI获胜！再接再厉！';
        } else {
            return '平局！';
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

    // 绘制3D立体棋盘
    drawBoard() {
        const ctx = this.ctx;
        
        // 清空画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制3D棋盘背景
        this.draw3DBackground();
        
        // 绘制3D网格线
        this.draw3DGrid();
        
        // 绘制3D天元点
        this.draw3DStarPoints();
        
        // 绘制棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    this.draw3DPiece(row, col, this.board[row][col]);
                }
            }
        }
        
        // 绘制提示
        if (this.hintMove) {
            this.drawHint(this.hintMove.row, this.hintMove.col);
        }
        
        // 绘制AI最新落子高亮
        if (this.lastAiMove) {
            this.draw3DAiMoveHighlight(this.lastAiMove.row, this.lastAiMove.col);
        }
    }

    // 绘制3D棋盘背景
    draw3DBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 创建高级木纹渐变背景
        const woodGradient = ctx.createLinearGradient(0, 0, width, height);
        woodGradient.addColorStop(0, '#f4e4bc');
        woodGradient.addColorStop(0.15, '#e6d3a3');
        woodGradient.addColorStop(0.3, '#deb887');
        woodGradient.addColorStop(0.45, '#d2b48c');
        woodGradient.addColorStop(0.6, '#cd853f');
        woodGradient.addColorStop(0.75, '#daa520');
        woodGradient.addColorStop(0.9, '#b8860b');
        woodGradient.addColorStop(1, '#9a7500');
        
        ctx.fillStyle = woodGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 添加木纹纹理效果
        this.addWoodTexture();
        
        // 添加3D边框效果
        this.draw3DBorder();
    }

    // 添加高级木纹纹理
    addWoodTexture() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 木纹主纹理
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = '#8b4513';
        
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const length = 15 + Math.random() * 50;
            const angle = (Math.random() - 0.5) * 0.8;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(-length/2, 0);
            ctx.lineTo(length/2, 0);
            ctx.lineWidth = 0.3 + Math.random() * 1.2;
            ctx.stroke();
            ctx.restore();
        }
        
        // 年轮效果
        ctx.globalAlpha = 0.08;
        const centerX = width / 2;
        const centerY = height / 2;
        
        for (let i = 0; i < 5; i++) {
            const radius = 50 + i * 80;
            ctx.strokeStyle = i % 2 === 0 ? '#a0522d' : '#8b4513';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX + (Math.random() - 0.5) * 100, centerY + (Math.random() - 0.5) * 100, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
    }

    // 绘制高级3D边框
    draw3DBorder() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const borderWidth = 12;
        
        // 顶部高光带
        const topGradient = ctx.createLinearGradient(0, 0, 0, borderWidth);
        topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        topGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        topGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.fillStyle = topGradient;
        ctx.fillRect(0, 0, width, borderWidth);
        
        // 左侧高光带
        const leftGradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
        leftGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        leftGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
        leftGradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
        ctx.fillStyle = leftGradient;
        ctx.fillRect(0, 0, borderWidth, height);
        
        // 底部阴影带
        const bottomGradient = ctx.createLinearGradient(0, height - borderWidth, 0, height);
        bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
        bottomGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
        bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = bottomGradient;
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        
        // 右侧阴影带
        const rightGradient = ctx.createLinearGradient(width - borderWidth, 0, width, 0);
        rightGradient.addColorStop(0, 'rgba(0, 0, 0, 0.02)');
        rightGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
        rightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = rightGradient;
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        // 角落加强效果
        this.draw3DCorners(borderWidth);
    }

    // 绘制3D角落效果
    draw3DCorners(borderWidth) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 左上角高光
        const tlGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, borderWidth * 1.5);
        tlGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        tlGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = tlGradient;
        ctx.fillRect(0, 0, borderWidth * 1.5, borderWidth * 1.5);
        
        // 右下角阴影
        const brGradient = ctx.createRadialGradient(width, height, 0, width, height, borderWidth * 1.5);
        brGradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        brGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = brGradient;
        ctx.fillRect(width - borderWidth * 1.5, height - borderWidth * 1.5, borderWidth * 1.5, borderWidth * 1.5);
    }

    // 绘制3D网格线系统
    draw3DGrid() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        
        // 主网格线
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.9;
        
        for (let i = 0; i < this.boardSize; i++) {
            const offset = cellSize * (i + 0.5);
            
            // 垂直线主线
            ctx.beginPath();
            ctx.moveTo(offset, cellSize * 0.5);
            ctx.lineTo(offset, cellSize * (this.boardSize - 0.5));
            ctx.stroke();
            
            // 水平线主线
            ctx.beginPath();
            ctx.moveTo(cellSize * 0.5, offset);
            ctx.lineTo(cellSize * (this.boardSize - 0.5), offset);
            ctx.stroke();
        }
        
        // 3D深度效果线条
        ctx.strokeStyle = 'rgba(101, 67, 33, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < this.boardSize; i++) {
            const offset = cellSize * (i + 0.5);
            
            // 垂直深度线
            ctx.beginPath();
            ctx.moveTo(offset + 1.5, cellSize * 0.5);
            ctx.lineTo(offset + 1.5, cellSize * (this.boardSize - 0.5));
            ctx.stroke();
            
            // 水平深度线
            ctx.beginPath();
            ctx.moveTo(cellSize * 0.5, offset + 1.5);
            ctx.lineTo(cellSize * (this.boardSize - 0.5), offset + 1.5);
            ctx.stroke();
        }
        
        // 绘制网格交叉点的3D凹陷效果
        this.draw3DIntersections();
        
        ctx.globalAlpha = 1;
    }

    // 绘制3D交叉点凹陷效果
    draw3DIntersections() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    const x = cellSize * (col + 0.5);
                    const y = cellSize * (row + 0.5);
                    
                    // 凹陷阴影
                    const shadowGradient = ctx.createRadialGradient(x, y, 0, x, y, 4);
                    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
                    shadowGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.05)');
                    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    
                    ctx.fillStyle = shadowGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // 凹陷高光
                    const highlightGradient = ctx.createRadialGradient(x - 1, y - 1, 0, x - 1, y - 1, 2);
                    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
                    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = highlightGradient;
                    ctx.beginPath();
                    ctx.arc(x - 1, y - 1, 2, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    }

    // 绘制3D立体天元点
    draw3DStarPoints() {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const center = Math.floor(this.boardSize / 2);
        const points = [
            [center, center],
            [3, 3], [3, center], [3, this.boardSize - 4],
            [center, 3], [center, this.boardSize - 4],
            [this.boardSize - 4, 3], [this.boardSize - 4, center], [this.boardSize - 4, this.boardSize - 4]
        ];
        
        points.forEach(([row, col]) => {
            const x = cellSize * (col + 0.5);
            const y = cellSize * (row + 0.5);
            
            // 底部阴影
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(x + 1, y + 1, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // 主体渐变
            const gradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 6);
            gradient.addColorStop(0, '#f4e4bc');
            gradient.addColorStop(0.3, '#daa520');
            gradient.addColorStop(0.7, '#b8860b');
            gradient.addColorStop(1, '#8b4513');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // 高光点
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(x - 1.5, y - 1.5, 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // 边缘高光
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.stroke();
        });
    }

    // 绘制3D立体棋子
    draw3DPiece(row, col, player) {
        const ctx = this.ctx;
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        const radius = this.cellSize * 0.42;
        
        ctx.save();
        
        if (player === 1) {
            // 3D黑子效果
            this.draw3DBlackPiece(x, y, radius);
        } else if (player === 2) {
            // 3D白子效果
            this.draw3DWhitePiece(x, y, radius);
        }
        
        ctx.restore();
    }

    // 绘制3D黑子
    draw3DBlackPiece(x, y, radius) {
        const ctx = this.ctx;
        
        // 外部投影
        const shadowGradient = ctx.createRadialGradient(x + 3, y + 3, 0, x + 3, y + 3, radius + 5);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.arc(x + 3, y + 3, radius + 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // 主体球体渐变
        const mainGradient = ctx.createRadialGradient(
            x - radius * 0.4, y - radius * 0.4, 0,
            x, y, radius
        );
        mainGradient.addColorStop(0, '#666666');
        mainGradient.addColorStop(0.2, '#444444');
        mainGradient.addColorStop(0.5, '#222222');
        mainGradient.addColorStop(0.8, '#111111');
        mainGradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 主高光点
        const highlight1 = ctx.createRadialGradient(
            x - radius * 0.35, y - radius * 0.35, 0,
            x - radius * 0.35, y - radius * 0.35, radius * 0.4
        );
        highlight1.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlight1.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
        highlight1.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = highlight1;
        ctx.beginPath();
        ctx.arc(x - radius * 0.35, y - radius * 0.35, radius * 0.4, 0, 2 * Math.PI);
        ctx.fill();
        
        // 次高光点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.15, 0, 2 * Math.PI);
        ctx.fill();
        
        // 反射光
        const reflectGradient = ctx.createLinearGradient(
            x - radius, y + radius * 0.3,
            x + radius, y + radius * 0.3
        );
        reflectGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        reflectGradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.1)');
        reflectGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
        reflectGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = reflectGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.9, 0, 2 * Math.PI);
        ctx.fill();
        
        // 3D边缘效果
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.stroke();\n    }\n\n    // 绘制3D白子\n    draw3DWhitePiece(x, y, radius) {\n        const ctx = this.ctx;\n        \n        // 外部投影\n        const shadowGradient = ctx.createRadialGradient(x + 2, y + 2, 0, x + 2, y + 2, radius + 4);\n        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');\n        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');\n        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');\n        \n        ctx.fillStyle = shadowGradient;\n        ctx.beginPath();\n        ctx.arc(x + 2, y + 2, radius + 4, 0, 2 * Math.PI);\n        ctx.fill();\n        \n        // 主体球体渐变\n        const mainGradient = ctx.createRadialGradient(\n            x - radius * 0.3, y - radius * 0.3, 0,\n            x, y, radius\n        );\n        mainGradient.addColorStop(0, '#ffffff');\n        mainGradient.addColorStop(0.3, '#fafafa');\n        mainGradient.addColorStop(0.6, '#f0f0f0');\n        mainGradient.addColorStop(0.8, '#e0e0e0');\n        mainGradient.addColorStop(1, '#c8c8c8');\n        \n        ctx.fillStyle = mainGradient;\n        ctx.beginPath();\n        ctx.arc(x, y, radius, 0, 2 * Math.PI);\n        ctx.fill();\n        \n        // 珍珠光泽效果\n        const pearlGradient = ctx.createRadialGradient(\n            x - radius * 0.4, y - radius * 0.4, 0,\n            x - radius * 0.4, y - radius * 0.4, radius * 0.6\n        );\n        pearlGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');\n        pearlGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.5)');\n        pearlGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');\n        \n        ctx.fillStyle = pearlGradient;\n        ctx.beginPath();\n        ctx.arc(x - radius * 0.4, y - radius * 0.4, radius * 0.6, 0, 2 * Math.PI);\n        ctx.fill();\n        \n        // 主高光点\n        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';\n        ctx.beginPath();\n        ctx.arc(x - radius * 0.25, y - radius * 0.25, radius * 0.2, 0, 2 * Math.PI);\n        ctx.fill();\n        \n        // 次高光点\n        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';\n        ctx.beginPath();\n        ctx.arc(x - radius * 0.1, y - radius * 0.4, radius * 0.1, 0, 2 * Math.PI);\n        ctx.fill();\n        \n        // 环境反射\n        const envGradient = ctx.createLinearGradient(\n            x - radius, y,\n            x + radius, y\n        );\n        envGradient.addColorStop(0, 'rgba(173, 216, 230, 0)');\n        envGradient.addColorStop(0.3, 'rgba(173, 216, 230, 0.15)');\n        envGradient.addColorStop(0.7, 'rgba(173, 216, 230, 0.15)');\n        envGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');\n        \n        ctx.fillStyle = envGradient;\n        ctx.beginPath();\n        ctx.arc(x, y, radius * 0.85, 0, 2 * Math.PI);\n        ctx.fill();\n        \n        // 3D边缘效果\n        ctx.strokeStyle = '#aaaaaa';\n        ctx.lineWidth = 1;\n        ctx.beginPath();\n        ctx.arc(x, y, radius, 0, 2 * Math.PI);\n        ctx.stroke();\n    }

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
    // 绘制3D AI移动高亮
    draw3DAiMoveHighlight(row, col) {
        const ctx = this.ctx;
        const x = this.cellSize * (col + 0.5);
        const y = this.cellSize * (row + 0.5);
        const baseRadius = this.cellSize * 0.5;
        
        // 动画时间
        const time = Date.now() / 1000;
        const pulseScale = 1 + Math.sin(time * 4) * 0.2;
        const glowIntensity = 0.6 + Math.sin(time * 3) * 0.3;
        
        ctx.save();
        
        // 3D光晕效果
        const glowRadius = baseRadius * pulseScale;
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        glowGradient.addColorStop(0, `rgba(52, 152, 219, ${glowIntensity * 0.8})`);
        glowGradient.addColorStop(0.5, `rgba(52, 152, 219, ${glowIntensity * 0.4})`);
        glowGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 3D环形高亮
        const ringRadius = baseRadius * 0.8;
        ctx.strokeStyle = `rgba(52, 152, 219, ${glowIntensity})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 内环光效
        const innerRingRadius = baseRadius * 0.6;
        ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, innerRingRadius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 3D标识背景
        const textBgGradient = ctx.createRadialGradient(x, y, 0, x, y, 18);
        textBgGradient.addColorStop(0, `rgba(52, 152, 219, ${glowIntensity * 0.9})`);
        textBgGradient.addColorStop(0.7, `rgba(52, 152, 219, ${glowIntensity * 0.5})`);
        textBgGradient.addColorStop(1, 'rgba(52, 152, 219, 0)');
        
        ctx.fillStyle = textBgGradient;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, 2 * Math.PI);
        ctx.fill();
        
        // 3D立体文字效果
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px Arial';
        
        // 文字阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText('AI', x + 1, y + 1);
        
        // 主文字
        ctx.fillStyle = '#ffffff';
        ctx.fillText('AI', x, y);
        
        // 文字高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('AI', x - 0.5, y - 0.5);
        
        ctx.restore();
        
        // 继续动画
        setTimeout(() => {
            if (this.lastAiMove && this.lastAiMove.row === row && this.lastAiMove.col === col) {
                this.drawBoard();
            }
        }, 50);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});