// 生产环境 app.js
App({
  globalData: {
    serverUrl: 'https://yourdomain.com', // 替换为你的实际域名
    gameId: null,
    userInfo: null
  },

  onLaunch() {
    console.log('五子棋小程序启动 - 生产环境')
    
    // 检查网络状态
    this.checkNetworkStatus()
    
    // 检查服务器连接
    this.checkServerConnection()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  onError(error) {
    console.error('小程序发生错误：', error)
    
    // 生产环境错误上报（可选）
    this.reportError(error)
  },

  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型：', res.networkType)
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接失败',
            icon: 'none'
          })
        }
      }
    })
  },

  // 检查服务器连接
  checkServerConnection() {
    wx.request({
      url: this.globalData.serverUrl + '/api/health',
      method: 'GET',
      timeout: 5000,
      success: (res) => {
        if (res.statusCode === 200) {
          console.log('服务器连接正常')
        } else {
          console.error('服务器响应异常：', res.statusCode)
          this.showServerError()
        }
      },
      fail: (err) => {
        console.error('服务器连接失败：', err)
        this.showServerError()
      }
    })
  },

  // 显示服务器错误
  showServerError() {
    wx.showModal({
      title: '连接失败',
      content: '无法连接到游戏服务器，请检查网络后重试',
      showCancel: false,
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          this.checkServerConnection()
        }
      }
    })
  },

  // 创建新游戏
  newGame(difficulty, callback) {
    wx.showLoading({
      title: '创建游戏中...'
    })

    wx.request({
      url: this.globalData.serverUrl + '/api/new_game',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        difficulty: difficulty || 3
      },
      timeout: 10000,
      success: (res) => {
        wx.hideLoading()
        
        if (res.statusCode === 200 && res.data && res.data.success) {
          this.globalData.gameId = res.data.game_id
          console.log('游戏创建成功：', res.data.game_id)
          if (callback) callback(null, res.data)
        } else {
          console.error('创建游戏失败：', res.data)
          if (callback) callback(res.data?.message || '创建游戏失败', null)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('请求失败：', err)
        if (callback) callback('网络请求失败，请检查连接', null)
      }
    })
  },

  // 玩家落子
  makeMove(row, col, aiSpeed, callback) {
    // 兼容性处理
    if (typeof aiSpeed === 'function') {
      callback = aiSpeed
      aiSpeed = 2
    }

    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null)
      return
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
      timeout: 15000, // 生产环境增加超时时间
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          console.log('落子成功：', res.data)
          if (callback) callback(null, res.data)
        } else {
          console.error('落子失败：', res.data)
          if (callback) callback(res.data?.message || res.data?.error || '落子失败', null)
        }
      },
      fail: (err) => {
        console.error('请求失败：', err)
        if (callback) callback('网络请求失败，请检查连接', null)
      }
    })
  },

  // 获取棋盘状态
  getBoardState(callback) {
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null)
      return
    }

    wx.request({
      url: this.globalData.serverUrl + '/api/get_board_state',
      method: 'GET',
      data: {
        game_id: this.globalData.gameId
      },
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          if (callback) callback(null, res.data)
        } else {
          if (callback) callback(res.data?.message || '获取状态失败', null)
        }
      },
      fail: (err) => {
        if (callback) callback('网络请求失败', null)
      }
    })
  },

  // 获取AI提示
  getAIHint(callback) {
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null)
      return
    }

    wx.request({
      url: this.globalData.serverUrl + '/api/ai_hint',
      method: 'GET',
      data: {
        game_id: this.globalData.gameId
      },
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          if (callback) callback(null, res.data)
        } else {
          if (callback) callback(res.data?.message || '获取提示失败', null)
        }
      },
      fail: (err) => {
        if (callback) callback('网络请求失败', null)
      }
    })
  },

  // 重置游戏
  resetGame(callback) {
    if (!this.globalData.gameId) {
      if (callback) callback('游戏未开始', null)
      return
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
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.success) {
          if (callback) callback(null, res.data)
        } else {
          if (callback) callback(res.data?.message || '重置失败', null)
        }
      },
      fail: (err) => {
        if (callback) callback('网络请求失败', null)
      }
    })
  },

  // 错误上报（生产环境可选功能）
  reportError(error) {
    // 这里可以集成错误监控服务
    // 如：腾讯云前端性能监控、Sentry等
    console.log('错误上报：', error)
  }
})