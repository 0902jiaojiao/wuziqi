// game.js
const app = getApp();

Page({
  data: {
    // 游戏状态
    gameId: null,
    board: [],
    currentPlayer: 1,
    gameOver: false,
    winner: 0,
    gameStatus: '点击"新游戏"开始',
    
    // 界面相关
    canvasSize: 0,
    cellSize: 0,
    boardSize: 15,
    showGameOverModal: false,
    gameResultText: '',
    
    // AI设置
    difficultyOptions: ['简单', '普通', '困难', '专家', '大师'],
    difficultyIndex: 2, // 默认困难
    
    // AI速度设置
    speedOptions: ['极速', '快速', '普通', '慢速', '深思'],
    speedIndex: 2, // 默认普通
    
    // 提示功能
    hintMove: null,
    hintsRemaining: 1, // 剩余提示次数
    
    // Canvas上下文
    ctx: null,
    
    // 防止快速点击
    isProcessing: false,
    
    // 自定义弹窗
    showCustomToast: false,
    customToastText: '',
    showAiMoveHighlight: false,
    aiMoveText: ''
  },

  onLoad() {
    // 获取系统信息，计算画布大小
    wx.getSystemInfo({
      success: (res) => {
        const screenWidth = res.windowWidth;
        const padding = 40; // 两边边距
        const maxSize = screenWidth - padding;
        const canvasSize = Math.min(maxSize, 600); // 最大600rpx
        
        this.setData({
          canvasSize: canvasSize
        });
        
        this.initCanvas();
      }
    });
  },

  onReady() {
    // 页面渲染完成
  },

  // 初始化Canvas
  initCanvas() {
    const ctx = wx.createCanvasContext('gameCanvas');
    this.setData({ ctx });
    
    // 计算每个格子的大小
    const cellSize = this.data.canvasSize / (this.data.boardSize + 1);
    this.setData({ cellSize });
    
    // 初始化空棋盘
    const board = Array(this.data.boardSize).fill().map(() => 
      Array(this.data.boardSize).fill(0)
    );
    this.setData({ board });
    
    this.drawBoard();
  },

  // 绘制棋盘
  drawBoard() {
    const { ctx, canvasSize, boardSize, cellSize, board, hintMove } = this.data;
    
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // 设置画布背景
    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // 绘制网格线
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 1;
    
    for (let i = 1; i <= boardSize; i++) {
      const pos = i * cellSize;
      
      // 垂直线
      ctx.beginPath();
      ctx.moveTo(pos, cellSize);
      ctx.lineTo(pos, canvasSize - cellSize);
      ctx.stroke();
      
      // 水平线
      ctx.beginPath();
      ctx.moveTo(cellSize, pos);
      ctx.lineTo(canvasSize - cellSize, pos);
      ctx.stroke();
    }
    
    // 绘制天元和星位
    const center = Math.floor(boardSize / 2);
    const starPoints = [
      [3, 3], [3, center], [3, boardSize - 4],
      [center, 3], [center, center], [center, boardSize - 4],
      [boardSize - 4, 3], [boardSize - 4, center], [boardSize - 4, boardSize - 4]
    ];
    
    ctx.fillStyle = '#8b4513';
    starPoints.forEach(([row, col]) => {
      const x = (col + 1) * cellSize;
      const y = (row + 1) * cellSize;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // 绘制棋子
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const piece = board[row][col];
        if (piece !== 0) {
          this.drawPiece(row, col, piece);
        }
      }
    }
    
    // 绘制提示
    if (hintMove) {
      this.drawHint(hintMove.row, hintMove.col);
    }
    
    ctx.draw();
  },

  // 绘制棋子
  drawPiece(row, col, player) {
    const { ctx, cellSize } = this.data;
    const x = (col + 1) * cellSize;
    const y = (row + 1) * cellSize;
    const radius = cellSize * 0.4;
    
    // 绘制阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // 绘制棋子
    if (player === 1) {
      // 黑子
      ctx.fillStyle = '#2c3e50';
    } else {
      // 白子
      ctx.fillStyle = '#ecf0f1';
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 1;
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    if (player === 2) {
      ctx.stroke();
    }
  },

  // 绘制提示
  drawHint(row, col) {
    const { ctx, cellSize } = this.data;
    const x = (col + 1) * cellSize;
    const y = (row + 1) * cellSize;
    const radius = cellSize * 0.3;
    
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
  },

  // 处理画布点击
  onCanvasTouch(e) {
    console.log('点击棋盘，当前状态:', {
      gameOver: this.data.gameOver,
      currentPlayer: this.data.currentPlayer,
      gameId: this.data.gameId,
      isProcessing: this.data.isProcessing
    });
    
    // 防止重复点击
    if (this.data.isProcessing) {
      wx.showToast({
        title: '请稍等，正在处理中...',
        icon: 'none',
        duration: 1000
      });
      return;
    }
    
    if (this.data.gameOver) {
      wx.showToast({
        title: '游戏已结束',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    if (!this.data.gameId) {
      wx.showToast({
        title: '请先创建游戏',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    if (this.data.currentPlayer !== 1) {
      wx.showToast({
        title: '请等待AI落子完成',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    const { cellSize, boardSize } = this.data;
    const touch = e.touches[0];
    
    // 转换坐标
    const col = Math.round(touch.x / cellSize) - 1;
    const row = Math.round(touch.y / cellSize) - 1;
    
    // 检查坐标有效性
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
      return;
    }
    
    // 检查位置是否为空
    if (this.data.board[row][col] !== 0) {
      wx.showToast({
        title: '此位置已有棋子',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    // 清除提示
    if (this.data.hintMove) {
      this.setData({ hintMove: null });
    }
    
    // 发送落子请求
    this.makeMove(row, col);
  },

  // 玩家落子
  makeMove(row, col) {
    // 设置处理中状态，防止重复操作
    this.setData({
      isProcessing: true
    });
    
    wx.showLoading({ title: '落子中...' });
    
    app.makeMove(row, col, this.data.speedIndex, (error, result) => {
      wx.hideLoading();
      
      if (error) {
        console.error('落子失败:', error);
        // 网络请求失败时，尝试同步状态
        this.syncGameState(() => {
          this.setData({
            isProcessing: false
          });
          
          // 显示详细错误信息
          if (error.includes('网络请求失败')) {
            wx.showModal({
              title: '网络错误',
              content: '网络连接失败，请检查:\n1. 后端服务器是否运行\n2. 网络连接是否正常\n3. 服务器地址是否正确',
              showCancel: false,
              confirmText: '重新同步',
              success: () => {
                this.syncGameState();
              }
            });
          } else {
            wx.showToast({
              title: error,
              icon: 'none',
              duration: 2000
            });
          }
        });
        return;
      }
      
      console.log('落子响应:', result);
      
      // 更新棋盘状态
      this.updateGameState(result.board_state);
      
      // 重新绘制棋盘
      this.drawBoard();
      
      // 如果AI需要思考，先显示提示
      if (!result.board_state.game_over && result.ai_move) {
        // 先显示AI正在思考
        wx.showLoading({ title: 'AI正在思考中...' });
        
        // 等待一小段时间再隐藏loading
        setTimeout(() => {
          wx.hideLoading();
        }, 500);
      }
      
      // 检查游戏是否结束
      if (result.board_state.game_over) {
        this.setData({ isProcessing: false });
        this.handleGameOver(result.board_state.winner);
      } else {
        // 如果有AI移动，显示AI落子高亮提示
        if (result.ai_move) {
          console.log('AI落子完成:', result.ai_move);
          const thinkingTime = result.ai_thinking_time || 0;
          setTimeout(() => {
            this.showAiMoveHighlight(
              result.ai_move.row, 
              result.ai_move.col, 
              thinkingTime.toFixed(1)
            );
          }, 300);
        }
        
        // 延迟解除处理状态，确保状态更新完成
        setTimeout(() => {
          this.setData({ isProcessing: false });
          console.log('回合结束，当前玩家:', this.data.currentPlayer);
        }, 200);
      }
    });
  },

  // 更新游戏状态
  updateGameState(boardState) {
    console.log('更新游戏状态:', boardState);
    this.setData({
      board: boardState.board,
      currentPlayer: boardState.current_player,
      gameOver: boardState.game_over,
      winner: boardState.winner,
      gameStatus: this.getGameStatusText(boardState)
    });
    console.log('状态更新完成，当前玩家:', boardState.current_player);
  },

  // 获取游戏状态文本
  getGameStatusText(boardState) {
    if (boardState.game_over) {
      if (boardState.winner === 0) {
        return '游戏平局';
      } else if (boardState.winner === 1) {
        return '玩家获胜！';
      } else {
        return 'AI获胜！';
      }
    } else {
      return '游戏进行中';
    }
  },

  // 处理游戏结束
  handleGameOver(winner) {
    let resultText = '';
    if (winner === 0) {
      resultText = '游戏平局！要再来一局吗？';
    } else if (winner === 1) {
      resultText = '恭喜你获胜！再来一局挑战AI吧！';
    } else {
      resultText = 'AI获胜了！不要气馁，再试一次！';
    }
    
    this.setData({
      showGameOverModal: true,
      gameResultText: resultText
    });
  },

  // 新游戏
  onNewGame() {
    // 立即关闭弹窗
    this.setData({
      showGameOverModal: false
    });
    
    const difficulty = this.data.difficultyIndex + 1;
    
    wx.showLoading({ title: '创建游戏中...' });
    
    app.createNewGame(difficulty, (error, result) => {
      wx.hideLoading();
      
      if (error) {
        wx.showToast({
          title: error,
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 更新游戏状态
      this.setData({
        gameId: result.game_id,
        hintMove: null,
        hintsRemaining: 1  // 新游戏重置提示次数
      });
      
      this.updateGameState(result.board_state);
      this.drawBoard();
      
      wx.showToast({
        title: '新游戏开始！',
        icon: 'success',
        duration: 1500
      });
    });
  },

  // 重置游戏
  onResetGame() {
    // 立即关闭弹窗
    this.setData({
      showGameOverModal: false
    });
    
    if (!this.data.gameId) {
      wx.showToast({
        title: '请先创建游戏',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    wx.showLoading({ title: '重置游戏中...' });
    
    app.resetGame((error, result) => {
      wx.hideLoading();
      
      if (error) {
        wx.showToast({
          title: error,
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 更新游戏状态
      this.setData({
        hintMove: null,
        hintsRemaining: result.hints_remaining || 1  // 重置提示次数
      });
      
      this.updateGameState(result.board_state);
      this.drawBoard();
      
      wx.showToast({
        title: '游戏已重置！',
        icon: 'success',
        duration: 1500
      });
    });
  },

  // 获取AI提示
  onGetHint() {
    if (!this.data.gameId || this.data.gameOver || this.data.currentPlayer !== 1) {
      return;
    }
    
    // 检查是否还有提示次数
    if (this.data.hintsRemaining <= 0) {
      wx.showModal({
        title: '提示已用完',
        content: '每局游戏只能使用一次提示，重新开始游戏后可再次使用',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    wx.showLoading({ title: '获取提示中...' });
    
    app.getAIHint((error, result) => {
      wx.hideLoading();
      
      if (error) {
        // 处理特定错误
        if (error === 'hint_already_used' || error.includes('只能使用一次')) {
          this.setData({ hintsRemaining: 0 });
          wx.showModal({
            title: '提示已用完',
            content: '每局游戏只能使用一次提示',
            showCancel: false,
            confirmText: '知道了'
          });
        } else {
          wx.showToast({
            title: error,
            icon: 'none',
            duration: 2000
          });
        }
        return;
      }
      
      // 显示提示并更新剩余次数
      this.setData({
        hintMove: result.hint_move,
        hintsRemaining: result.hints_remaining || 0
      });
      
      this.drawBoard();
      
      this.showBoardSafeToast(`AI建议位置已标出（剩余${this.data.hintsRemaining}次）`, 2500);
    });
  },

  // 清除提示
  clearHint() {
    this.setData({ hintMove: null });
    this.drawBoard();
  },

  // 显示避开棋盘的Toast
  showBoardSafeToast(text, duration = 2000) {
    this.setData({
      showCustomToast: true,
      customToastText: text
    });
    
    setTimeout(() => {
      this.setData({
        showCustomToast: false,
        customToastText: ''
      });
    }, duration);
  },

  // 显示AI落子高亮提示
  showAiMoveHighlight(row, col, thinkingTime) {
    const moveText = `AI落子: (${row+1}, ${col+1}) [思考${thinkingTime}秒]`;
    
    this.setData({
      showAiMoveHighlight: true,
      aiMoveText: moveText
    });
    
    setTimeout(() => {
      this.setData({
        showAiMoveHighlight: false,
        aiMoveText: ''
      });
    }, 3000); // 显示3秒
  },

  // 改变难度
  onDifficultyChange(e) {
    this.setData({
      difficultyIndex: parseInt(e.detail.value)
    });
  },

  // 改变AI速度
  onSpeedChange(e) {
    this.setData({
      speedIndex: parseInt(e.detail.value)
    });
    
    // 速度对应的思考时间（秒）
    const speedTimes = [0.2, 0.8, 1.5, 2.5, 4.0]; // 极速到深思
    const selectedTime = speedTimes[parseInt(e.detail.value)];
    
    wx.showToast({
      title: `AI思考时间: ${selectedTime}秒`,
      icon: 'none',
      duration: 1500
    });
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showGameOverModal: false
    });
  },

  // 阻止事件冒泡（防止点击弹窗内容时关闭）
  stopPropagation() {
    // 空方法，仅用于阻止事件冒泡
  },

  // 同步游戏状态
  syncGameState(callback) {
    if (!this.data.gameId) {
      if (callback) callback();
      return;
    }

    console.log('正在同步游戏状态...');
    wx.showLoading({ title: '同步状态中...' });

    app.getBoardState((error, result) => {
      wx.hideLoading();
      
      if (error) {
        console.error('状态同步失败:', error);
        wx.showToast({
          title: '状态同步失败',
          icon: 'none',
          duration: 1500
        });
      } else {
        console.log('状态同步成功:', result);
        this.updateGameState(result.board_state);
        this.drawBoard();
        wx.showToast({
          title: '状态已同步',
          icon: 'success',
          duration: 1000
        });
      }
      
      if (callback) callback();
    });
  },

  // 手动刷新状态（可以添加到界面按钮）
  onRefreshState() {
    this.syncGameState();
  }
});