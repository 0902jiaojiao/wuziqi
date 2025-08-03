// 五子棋游戏配置文件
const GAME_CONFIG = {
    // 开发环境API地址
    DEV_API_URL: 'http://localhost:5001',
    
    // 生产环境API地址（需要替换为实际的后端URL）
    PROD_API_URL: 'https://your-backend-url.render.com',
    
    // 当前环境检测
    get API_URL() {
        // 检测是否在GitHub Pages环境
        if (window.location.hostname.includes('github.io') || 
            window.location.hostname.includes('pages.dev')) {
            return this.PROD_API_URL;
        }
        return this.DEV_API_URL;
    },
    
    // API端点
    endpoints: {
        newGame: '/api/new_game',
        makeMove: '/api/make_move',
        getBoardState: '/api/get_board_state',
        resetGame: '/api/reset_game',
        aiHint: '/api/ai_hint',
        health: '/api/health'
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
} else {
    window.GAME_CONFIG = GAME_CONFIG;
}