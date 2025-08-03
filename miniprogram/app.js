// app.js
App({
  globalData: {
    gameId: null,
    serverUrl: 'http://localhost:5001', // 后端服务器地址，部署时需要修改
    boardSize: 15,
    difficulty: 3
  },

  onLaunch() {
    console.log('五子棋小程序启动');
    
    // 检查服务器连接
    this.checkServerConnection();
  },

  checkServerConnection() {
    const self = this;
    console.log('正在连接服务器:', this.globalData.serverUrl);
    
    wx.request({
      url: this.globalData.serverUrl + '/api/health',
      method: 'GET',
      timeout: 5000,
      success(res) {
        console.log('服务器响应:', res);
        if (res.statusCode === 200 && res.data && res.data.success) {
          console.log('✓ 服务器连接正常');
          wx.showToast({
            title: '服务器连接成功',
            icon: 'success',
            duration: 1500
          });
        } else {
          console.error('服务器响应异常:', res);
          wx.showModal({
            title: '连接异常',
            content: '服务器响应异常，请检查后端服务',
            showCancel: false
          });
        }
      },
      fail(err) {
        console.error('连接服务器失败:', err);
        wx.showModal({
          title: '连接失败',
          content: '无法连接到后端服务器，请确保:\n1. 后端服务正在运行\n2. 服务器地址正确\n3. 网络连接正常',
          showCancel: false,
          confirmText: '知道了'
        });
      }
    });
  },

  // 创建新游戏
  createNewGame(difficulty = 3, callback) {
    const self = this;
    wx.request({
      url: this.globalData.serverUrl + '/api/new_game',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        difficulty: difficulty,
        board_size: this.globalData.boardSize,
        timestamp: new Date().toISOString()
      },
      success(res) {
        if (res.data && res.data.success) {
          self.globalData.gameId = res.data.game_id;
          self.globalData.difficulty = difficulty;
          console.log('新游戏创建成功:', res.data);
          if (callback) callback(null, res.data);
        } else {
          console.error('创建游戏失败:', res.data);
          if (callback) callback(res.data.error || '创建游戏失败', null);
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        if (callback) callback('网络请求失败', null);
      }
    });
  },

  // 玩家落子
  makeMove(row, col, aiSpeed, callback) {
    // 如果只传了3个参数，说明没有aiSpeed参数
    if (typeof aiSpeed === 'function') {
      callback = aiSpeed;
      aiSpeed = 2; // 默认普通速度
    }
    
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null);
      return;
    }

    wx.request({
      url: this.globalData.serverUrl + '/api/make_move',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        game_id: this.globalData.gameId,
        row: row,
        col: col,
        ai_speed: aiSpeed || 2
      },
      timeout: 10000, // 10秒超时
      success(res) {
        console.log('落子请求响应:', res);
        if (res.statusCode === 200 && res.data && res.data.success) {
          console.log('落子成功:', res.data);
          if (callback) callback(null, res.data);
        } else {
          console.error('落子失败:', res.data);
          if (callback) callback(res.data?.message || res.data?.error || '落子失败', null);
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        if (callback) callback('网络请求失败，请检查连接', null);
      }
    });
  },

  // 重置游戏
  resetGame(callback) {
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null);
      return;
    }

    wx.request({
      url: this.globalData.serverUrl + '/api/reset_game',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        game_id: this.globalData.gameId
      },
      success(res) {
        if (res.data && res.data.success) {
          console.log('游戏重置成功:', res.data);
          if (callback) callback(null, res.data);
        } else {
          console.error('重置游戏失败:', res.data);
          if (callback) callback(res.data.error || '重置游戏失败', null);
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        if (callback) callback('网络请求失败', null);
      }
    });
  },

  // 获取AI提示
  getAIHint(callback) {
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null);
      return;
    }

    wx.request({
      url: this.globalData.serverUrl + '/api/ai_hint',
      method: 'GET',
      data: {
        game_id: this.globalData.gameId
      },
      success(res) {
        if (res.data && res.data.success) {
          console.log('获取AI提示成功:', res.data);
          if (callback) callback(null, res.data);
        } else {
          console.error('获取AI提示失败:', res.data);
          if (callback) callback(res.data.error || '获取AI提示失败', null);
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        if (callback) callback('网络请求失败', null);
      }
    });
  },

  // 获取当前游戏状态（用于同步）
  getBoardState(callback) {
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null);
      return;
    }

    wx.request({
      url: this.globalData.serverUrl + '/api/get_board_state',
      method: 'GET',
      data: {
        game_id: this.globalData.gameId
      },
      success(res) {
        if (res.data && res.data.success) {
          console.log('获取棋盘状态成功:', res.data);
          if (callback) callback(null, res.data);
        } else {
          console.error('获取棋盘状态失败:', res.data);
          if (callback) callback(res.data.error || '获取棋盘状态失败', null);
        }
      },
      fail(err) {
        console.error('请求失败:', err);
        if (callback) callback('网络请求失败', null);
      }
    });
  }
});