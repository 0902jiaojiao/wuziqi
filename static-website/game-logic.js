/**
 * 五子棋游戏核心逻辑 - JavaScript版本
 * 移植自Python backend/game_logic.py
 */

class GomokuGame {
    constructor(boardSize = 15) {
        this.boardSize = boardSize;
        this.board = Array(boardSize).fill().map(() => Array(boardSize).fill(0));
        this.currentPlayer = 1; // 1为人类玩家(黑子)，2为AI玩家(白子)
        this.gameOver = false;
        this.winner = 0;
    }

    /**
     * 重置游戏
     */
    resetGame() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = 0;
    }

    /**
     * 检查落子是否有效
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @returns {boolean} 是否有效
     */
    isValidMove(row, col) {
        return (0 <= row && row < this.boardSize && 
                0 <= col && col < this.boardSize && 
                this.board[row][col] === 0 && 
                !this.gameOver);
    }

    /**
     * 落子
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {number} player - 玩家编号，默认为当前玩家
     * @returns {boolean} 是否成功落子
     */
    makeMove(row, col, player = null) {
        if (player === null) {
            player = this.currentPlayer;
        }

        if (!this.isValidMove(row, col)) {
            return false;
        }

        this.board[row][col] = player;

        // 检查是否获胜
        if (this.checkWinner(row, col, player)) {
            this.gameOver = true;
            this.winner = player;
        }
        // 检查是否平局
        else if (this.isBoardFull()) {
            this.gameOver = true;
            this.winner = 0; // 平局
        }
        else {
            // 切换玩家
            this.currentPlayer = 3 - this.currentPlayer;
        }

        return true;
    }

    /**
     * 检查指定位置的落子是否形成五子连珠
     * @param {number} row - 行坐标
     * @param {number} col - 列坐标
     * @param {number} player - 玩家编号
     * @returns {boolean} 是否获胜
     */
    checkWinner(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 主对角线
            [1, -1]   // 副对角线
        ];

        for (const [dx, dy] of directions) {
            let count = 1; // 包含当前落子

            // 向一个方向检查
            let x = row + dx;
            let y = col + dy;
            while (x >= 0 && x < this.boardSize && 
                   y >= 0 && y < this.boardSize && 
                   this.board[x][y] === player) {
                count++;
                x += dx;
                y += dy;
            }

            // 向相反方向检查
            x = row - dx;
            y = col - dy;
            while (x >= 0 && x < this.boardSize && 
                   y >= 0 && y < this.boardSize && 
                   this.board[x][y] === player) {
                count++;
                x -= dx;
                y -= dy;
            }

            if (count >= 5) {
                return true;
            }
        }

        return false;
    }

    /**
     * 检查棋盘是否已满
     * @returns {boolean}
     */
    isBoardFull() {
        for (const row of this.board) {
            if (row.includes(0)) {
                return false;
            }
        }
        return true;
    }

    /**
     * 获取所有有效的落子位置
     * @returns {Array} 有效位置数组
     */
    getValidMoves() {
        const moves = [];
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) {
                    moves.push([i, j]);
                }
            }
        }
        return moves;
    }

    /**
     * 获取当前棋盘状态
     * @returns {Object} 棋盘状态对象
     */
    getBoardState() {
        return {
            board: this.board.map(row => [...row]), // 深拷贝
            currentPlayer: this.currentPlayer,
            gameOver: this.gameOver,
            winner: this.winner,
            boardSize: this.boardSize
        };
    }

    /**
     * 创建游戏状态的副本
     * @returns {GomokuGame} 新的游戏实例
     */
    copy() {
        const newGame = new GomokuGame(this.boardSize);
        newGame.board = this.board.map(row => [...row]);
        newGame.currentPlayer = this.currentPlayer;
        newGame.gameOver = this.gameOver;
        newGame.winner = this.winner;
        return newGame;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GomokuGame;
} else {
    window.GomokuGame = GomokuGame;
}