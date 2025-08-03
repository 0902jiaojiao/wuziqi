/**
 * 五子棋AI玩家实现 - JavaScript版本
 * 使用Minimax算法配合Alpha-Beta剪枝和启发式评估函数
 * 移植自Python backend/ai_player.py
 */

class GomokuAI {
    constructor(difficulty = 3) {
        this.difficulty = difficulty;
        // 增加搜索深度，让AI更聪明
        const depthMap = {1: 2, 2: 3, 3: 4, 4: 6, 5: 8};
        this.maxDepth = depthMap[difficulty] || 4;
        this.aiPlayer = 2;  // AI是白子
        this.humanPlayer = 1;  // 人类是黑子
    }

    /**
     * 获取AI的最佳落子位置
     * @param {GomokuGame} game - 游戏实例
     * @returns {Array} [row, col] 最佳位置
     */
    getBestMove(game) {
        if (this.isOpeningMove(game)) {
            return this.getOpeningMove(game);
        }

        // 使用Minimax算法寻找最佳落子
        const [evalScore, bestMove] = this.minimax(game, this.maxDepth, true, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
        return bestMove;
    }

    /**
     * 检查是否是开局阶段
     * @param {GomokuGame} game 
     * @returns {boolean}
     */
    isOpeningMove(game) {
        let totalPieces = 0;
        for (let i = 0; i < game.boardSize; i++) {
            for (let j = 0; j < game.boardSize; j++) {
                if (game.board[i][j] !== 0) {
                    totalPieces++;
                }
            }
        }
        return totalPieces <= 2;
    }

    /**
     * 获取开局落子
     * @param {GomokuGame} game 
     * @returns {Array} [row, col]
     */
    getOpeningMove(game) {
        const center = Math.floor(game.boardSize / 2);

        // 如果是第一步，下在中心
        let isEmpty = true;
        for (let i = 0; i < game.boardSize && isEmpty; i++) {
            for (let j = 0; j < game.boardSize && isEmpty; j++) {
                if (game.board[i][j] !== 0) {
                    isEmpty = false;
                }
            }
        }
        if (isEmpty) {
            return [center, center];
        }

        // 如果中心已有子，在附近下子
        const nearbyPositions = [
            [center-1, center-1], [center-1, center], [center-1, center+1],
            [center, center-1], [center, center+1],
            [center+1, center-1], [center+1, center], [center+1, center+1]
        ];

        const validPositions = nearbyPositions.filter(([r, c]) => game.isValidMove(r, c));
        
        return validPositions.length > 0 ? 
            validPositions[Math.floor(Math.random() * validPositions.length)] : 
            this.getRandomMove(game);
    }

    /**
     * 获取随机有效落子位置
     * @param {GomokuGame} game 
     * @returns {Array|null}
     */
    getRandomMove(game) {
        const validMoves = game.getValidMoves();
        return validMoves.length > 0 ? 
            validMoves[Math.floor(Math.random() * validMoves.length)] : 
            null;
    }

    /**
     * Minimax算法配合Alpha-Beta剪枝
     * @param {GomokuGame} game - 游戏状态
     * @param {number} depth - 搜索深度
     * @param {boolean} maximizingPlayer - 是否是最大化玩家
     * @param {number} alpha - Alpha值
     * @param {number} beta - Beta值
     * @returns {Array} [评估分数, 最佳落子位置]
     */
    minimax(game, depth, maximizingPlayer, alpha, beta) {
        if (depth === 0 || game.gameOver) {
            return [this.evaluateBoard(game), null];
        }

        // 获取候选落子位置（减少搜索空间）
        const candidateMoves = this.getCandidateMoves(game);

        if (maximizingPlayer) {
            let maxEval = Number.NEGATIVE_INFINITY;
            let bestMove = null;

            // 首先检查是否有直接获胜的机会
            for (const [row, col] of candidateMoves) {
                const gameCopy = game.copy();
                gameCopy.makeMove(row, col, this.aiPlayer);

                // 如果这步棋直接获胜，立即返回最高分数
                if (gameCopy.gameOver && gameCopy.winner === this.aiPlayer) {
                    return [100000, [row, col]];  // 确保优先选择获胜棋步
                }

                const [evalScore, unusedMove] = this.minimax(gameCopy, depth - 1, false, alpha, beta);

                if (evalScore > maxEval) {
                    maxEval = evalScore;
                    bestMove = [row, col];
                }

                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) {
                    break;  // Alpha-Beta剪枝
                }
            }

            return [maxEval, bestMove];
        } else {
            let minEval = Number.POSITIVE_INFINITY;
            let bestMove = null;

            // 检查是否需要阻止对手获胜
            for (const [row, col] of candidateMoves) {
                const gameCopy = game.copy();
                gameCopy.makeMove(row, col, this.humanPlayer);

                let evalScore;
                // 如果对手这步棋直接获胜，给予极低分数
                if (gameCopy.gameOver && gameCopy.winner === this.humanPlayer) {
                    evalScore = -100000;  // 必须阻止对手获胜
                } else {
                    const [evalResult, unusedMove] = this.minimax(gameCopy, depth - 1, true, alpha, beta);
                    evalScore = evalResult;
                }

                if (evalScore < minEval) {
                    minEval = evalScore;
                    bestMove = [row, col];
                }

                beta = Math.min(beta, evalScore);
                if (beta <= alpha) {
                    break;  // Alpha-Beta剪枝
                }
            }

            return [minEval, bestMove];
        }
    }

    /**
     * 智能获取候选落子位置，优先考虑威胁和防守
     * @param {GomokuGame} game 
     * @returns {Array} 候选位置数组
     */
    getCandidateMoves(game) {
        // 如果棋盘为空，选择中心
        let isEmpty = true;
        for (let i = 0; i < game.boardSize && isEmpty; i++) {
            for (let j = 0; j < game.boardSize && isEmpty; j++) {
                if (game.board[i][j] !== 0) {
                    isEmpty = false;
                }
            }
        }
        if (isEmpty) {
            const center = Math.floor(game.boardSize / 2);
            return [[center, center]];
        }

        // 1. 寻找关键位置（必须防守或攻击）
        const criticalMoves = this.findCriticalPositions(game);
        if (criticalMoves.length > 0) {
            return criticalMoves.slice(0, 5);  // 关键位置优先
        }

        // 2. 寻找有价值的位置
        const valuableMoves = [];

        // 只考虑已有棋子周围1-2格的位置
        const candidates = new Set();
        for (let i = 0; i < game.boardSize; i++) {
            for (let j = 0; j < game.boardSize; j++) {
                if (game.board[i][j] !== 0) {
                    // 周围1格必须考虑，2格选择性考虑
                    for (let di = -2; di <= 2; di++) {
                        for (let dj = -2; dj <= 2; dj++) {
                            const ni = i + di;
                            const nj = j + dj;
                            if (ni >= 0 && ni < game.boardSize && 
                                nj >= 0 && nj < game.boardSize && 
                                game.board[ni][nj] === 0) {
                                // 优先考虑直接相邻的位置
                                if (Math.abs(di) <= 1 && Math.abs(dj) <= 1) {
                                    candidates.add(`${ni},${nj}`);
                                } else if (Math.abs(di) <= 2 && Math.abs(dj) <= 2) {
                                    // 2格范围内的位置需要有更多邻居才考虑
                                    const neighborCount = this.countNeighbors(game, ni, nj);
                                    if (neighborCount >= 2) {
                                        candidates.add(`${ni},${nj}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 评估每个候选位置的价值
        for (const posStr of candidates) {
            const [row, col] = posStr.split(',').map(Number);
            const value = this.evaluatePositionValue(game, row, col);
            if (value > 0) {
                valuableMoves.push([row, col, value]);
            }
        }

        // 按价值排序
        valuableMoves.sort((a, b) => b[2] - a[2]);

        // 返回前10个最有价值的位置
        let result = valuableMoves.slice(0, 10).map(move => [move[0], move[1]]);

        // 如果没有找到有价值的位置，返回基本候选
        if (result.length === 0) {
            result = Array.from(candidates).slice(0, 15).map(posStr => {
                const [row, col] = posStr.split(',').map(Number);
                return [row, col];
            });
        }

        return result.length > 0 ? result : game.getValidMoves().slice(0, 10);
    }

    /**
     * 评估棋盘局面
     * @param {GomokuGame} game - 游戏状态
     * @returns {number} 评估分数（正数对AI有利，负数对人类有利）
     */
    evaluateBoard(game) {
        if (game.gameOver) {
            if (game.winner === this.aiPlayer) {
                return 10000;
            } else if (game.winner === this.humanPlayer) {
                return -10000;
            } else {
                return 0;  // 平局
            }
        }

        // 增强评估：优先考虑攻防威胁
        const aiScore = this.evaluatePlayerEnhanced(game, this.aiPlayer);
        const humanScore = this.evaluatePlayerEnhanced(game, this.humanPlayer);

        // 加重防守权重：防止对手获胜比自己获胜更重要
        const defenseBonus = this.checkImmediateThreats(game, this.humanPlayer) * -1500;
        const attackBonus = this.checkImmediateThreats(game, this.aiPlayer) * 1200;

        return aiScore - humanScore * 1.1 + defenseBonus + attackBonus;
    }

    /**
     * 增强的玩家评估函数
     * @param {GomokuGame} game 
     * @param {number} player 
     * @returns {number}
     */
    evaluatePlayerEnhanced(game, player) {
        let score = 0;

        // 检查所有方向的连子情况
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let i = 0; i < game.boardSize; i++) {
            for (let j = 0; j < game.boardSize; j++) {
                if (game.board[i][j] === player) {
                    for (const [dx, dy] of directions) {
                        score += this.evaluateLineEnhanced(game, i, j, dx, dy, player);
                    }
                }
            }
        }

        return score;
    }

    /**
     * 增强的连线评估
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} player 
     * @returns {number}
     */
    evaluateLineEnhanced(game, row, col, dx, dy, player) {
        let score = 0;

        // 检查不同长度的连子模式
        for (let length = 2; length <= 5; length++) {  // 检查2-5连
            for (let startOffset = -length + 1; startOffset <= 0; startOffset++) {
                const line = [];
                for (let k = 0; k < length; k++) {
                    const r = row + (startOffset + k) * dx;
                    const c = col + (startOffset + k) * dy;
                    if (r >= 0 && r < game.boardSize && c >= 0 && c < game.boardSize) {
                        line.push(game.board[r][c]);
                    } else {
                        line.push(-1);  // 边界
                    }
                }

                if (line.length === length) {
                    score += this.scorePattern(line, player, length);
                }
            }
        }

        return score;
    }

    /**
     * 为特定模式打分
     * @param {Array} line 
     * @param {number} player 
     * @param {number} length 
     * @returns {number}
     */
    scorePattern(line, player, length) {
        const myCount = line.filter(cell => cell === player).length;
        const emptyCount = line.filter(cell => cell === 0).length;
        const opponent = 3 - player;
        const opponentCount = line.filter(cell => cell === opponent).length;

        // 如果有对手棋子，这个模式无价值
        if (opponentCount > 0) {
            return 0;
        }

        // 根据连子数量和空位给分
        if (length === 5) {
            if (myCount === 5) {
                return 10000;  // 五连胜利
            } else if (myCount === 4 && emptyCount === 1) {
                return 1000;   // 活四
            } else if (myCount === 3 && emptyCount === 2) {
                return 100;    // 活三
            } else if (myCount === 2 && emptyCount === 3) {
                return 10;     // 活二
            }
        } else if (length === 4) {
            if (myCount === 4) {
                return 800;    // 冲四
            } else if (myCount === 3 && emptyCount === 1) {
                return 50;     // 冲三
            } else if (myCount === 2 && emptyCount === 2) {
                return 5;      // 活二
            }
        } else if (length === 3) {
            if (myCount === 3) {
                return 200;    // 连三
            } else if (myCount === 2 && emptyCount === 1) {
                return 2;      // 连二
            }
        }

        return 0;
    }

    /**
     * 检查立即威胁（四连、活三等）
     * @param {GomokuGame} game 
     * @param {number} player 
     * @returns {number}
     */
    checkImmediateThreats(game, player) {
        let threatCount = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let i = 0; i < game.boardSize; i++) {
            for (let j = 0; j < game.boardSize; j++) {
                if (game.board[i][j] === 0) {  // 空位
                    // 模拟在这个位置放子
                    game.board[i][j] = player;

                    // 检查是否形成威胁
                    for (const [dx, dy] of directions) {
                        const count = this.countConsecutive(game, i, j, dx, dy, player);
                        if (count >= 4) {  // 四连或以上
                            threatCount++;
                        } else if (count === 3) {  // 三连，检查是否是活三
                            if (this.isLiveThree(game, i, j, dx, dy, player)) {
                                threatCount++;
                            }
                        }
                    }

                    // 恢复空位
                    game.board[i][j] = 0;
                }
            }
        }

        return threatCount;
    }

    /**
     * 计算连续棋子数量
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} player 
     * @returns {number}
     */
    countConsecutive(game, row, col, dx, dy, player) {
        let count = 1;  // 包含当前位置

        // 向前计数
        let r = row + dx;
        let c = col + dy;
        while (r >= 0 && r < game.boardSize && c >= 0 && c < game.boardSize && 
               game.board[r][c] === player) {
            count++;
            r += dx;
            c += dy;
        }

        // 向后计数
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < game.boardSize && c >= 0 && c < game.boardSize && 
               game.board[r][c] === player) {
            count++;
            r -= dx;
            c -= dy;
        }

        return count;
    }

    /**
     * 检查是否是活三（两端都可以扩展）
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} player 
     * @returns {boolean}
     */
    isLiveThree(game, row, col, dx, dy, player) {
        // 检查三连的两端是否都是空位
        const frontR = row + 4 * dx;
        const frontC = col + 4 * dy;
        const backR = row - dx;
        const backC = col - dy;

        const frontEmpty = (frontR >= 0 && frontR < game.boardSize && 
                           frontC >= 0 && frontC < game.boardSize && 
                           game.board[frontR][frontC] === 0);

        const backEmpty = (backR >= 0 && backR < game.boardSize && 
                          backC >= 0 && backC < game.boardSize && 
                          game.board[backR][backC] === 0);

        return frontEmpty && backEmpty;
    }

    /**
     * 寻找关键位置：必须防守或可以获胜的位置
     * @param {GomokuGame} game 
     * @returns {Array}
     */
    findCriticalPositions(game) {
        const critical = [];
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let i = 0; i < game.boardSize; i++) {
            for (let j = 0; j < game.boardSize; j++) {
                if (game.board[i][j] === 0) {
                    // 检查防守价值（阻止对手）
                    game.board[i][j] = this.humanPlayer;
                    let defenseValue = 0;

                    for (const [dx, dy] of directions) {
                        const count = this.countConsecutive(game, i, j, dx, dy, this.humanPlayer);
                        if (count >= 5) {
                            defenseValue = 50000;  // 必须防守，立即获胜
                            break;
                        } else if (count === 4) {
                            // 检查是否是真正的活四
                            if (this.isWinningFour(game, i, j, dx, dy, this.humanPlayer)) {
                                defenseValue = Math.max(defenseValue, 40000);  // 必须防守的活四
                            } else {
                                defenseValue = Math.max(defenseValue, 8000);   // 冲四也要防
                            }
                        } else if (count === 3) {
                            // 检查是否是活三
                            if (this.isLiveThreeThreat(game, i, j, dx, dy, this.humanPlayer)) {
                                defenseValue = Math.max(defenseValue, 3000);  // 活三威胁
                            } else {
                                defenseValue = Math.max(defenseValue, 500);   // 普通三连
                            }
                        }
                    }

                    game.board[i][j] = 0;  // 恢复

                    // 检查攻击价值（AI自己）
                    game.board[i][j] = this.aiPlayer;
                    let attackValue = 0;

                    for (const [dx, dy] of directions) {
                        const count = this.countConsecutive(game, i, j, dx, dy, this.aiPlayer);
                        if (count >= 5) {
                            attackValue = 100000;  // 直接获胜，最高优先级
                            break;
                        } else if (count === 4) {
                            // 检查是否是获胜的活四
                            if (this.isWinningFour(game, i, j, dx, dy, this.aiPlayer)) {
                                attackValue = Math.max(attackValue, 80000);  // 活四获胜
                            } else {
                                attackValue = Math.max(attackValue, 15000);  // 冲四
                            }
                        } else if (count === 3) {
                            // 检查是否是活三
                            if (this.isLiveThreeThreat(game, i, j, dx, dy, this.aiPlayer)) {
                                attackValue = Math.max(attackValue, 5000);   // 活三
                            } else {
                                attackValue = Math.max(attackValue, 1000);   // 普通三连
                            }
                        }
                    }

                    game.board[i][j] = 0;  // 恢复

                    // 攻击优先，但防守也很重要
                    const totalValue = attackValue + defenseValue * 0.9;

                    if (totalValue >= 1000) {  // 重要位置阈值
                        critical.push([i, j, totalValue]);
                    }
                }
            }
        }

        // 按重要性排序
        critical.sort((a, b) => b[2] - a[2]);
        return critical.map(pos => [pos[0], pos[1]]);
    }

    /**
     * 评估位置的具体价值
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @returns {number}
     */
    evaluatePositionValue(game, row, col) {
        if (game.board[row][col] !== 0) {
            return 0;
        }

        let value = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        // 检查邻居密度（鼓励紧凑布局）
        const neighborCount = this.countNeighbors(game, row, col);
        if (neighborCount === 0) {
            return 0;  // 不考虑孤立位置
        }

        value += neighborCount * 20;  // 基础紧凑性奖励

        // 评估在每个方向的连子潜力
        for (const [dx, dy] of directions) {
            // AI连子潜力
            const aiPotential = this.calculateDirectionPotential(game, row, col, dx, dy, this.aiPlayer);
            value += aiPotential * 2;

            // 阻止对手潜力
            const humanPotential = this.calculateDirectionPotential(game, row, col, dx, dy, this.humanPlayer);
            value += humanPotential * 1.5;
        }

        // 位置偏好（略微偏向中心）
        const center = Math.floor(game.boardSize / 2);
        const centerDistance = Math.abs(row - center) + Math.abs(col - center);
        value += Math.max(0, 5 - centerDistance);

        return value;
    }

    /**
     * 计算某位置周围的棋子数量
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @returns {number}
     */
    countNeighbors(game, row, col) {
        let count = 0;
        for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) {
                    continue;
                }
                const ni = row + di;
                const nj = col + dj;
                if (ni >= 0 && ni < game.boardSize && 
                    nj >= 0 && nj < game.boardSize && 
                    game.board[ni][nj] !== 0) {
                    count++;
                }
            }
        }
        return count;
    }

    /**
     * 计算在特定方向的连子潜力
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} player 
     * @returns {number}
     */
    calculateDirectionPotential(game, row, col, dx, dy, player) {
        // 模拟放子
        game.board[row][col] = player;

        // 计算连子数
        const consecutive = this.countConsecutive(game, row, col, dx, dy, player);

        // 恢复
        game.board[row][col] = 0;

        // 根据连子数评分
        if (consecutive >= 5) {
            return 10000;
        } else if (consecutive === 4) {
            // 检查是否被封死
            return this.checkOpenEnds(game, row, col, dx, dy, consecutive) ? 1000 : 500;
        } else if (consecutive === 3) {
            return this.checkOpenEnds(game, row, col, dx, dy, consecutive) ? 200 : 100;
        } else if (consecutive === 2) {
            return this.checkOpenEnds(game, row, col, dx, dy, consecutive) ? 20 : 10;
        } else {
            return 0;
        }
    }

    /**
     * 检查连子两端是否有空位（简化版）
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} length 
     * @returns {boolean}
     */
    checkOpenEnds(game, row, col, dx, dy, length) {
        // 检查前端
        const frontR = row + length * dx;
        const frontC = col + length * dy;
        const frontOpen = (frontR >= 0 && frontR < game.boardSize && 
                          frontC >= 0 && frontC < game.boardSize && 
                          game.board[frontR][frontC] === 0);

        // 检查后端
        const backR = row - dx;
        const backC = col - dy;
        const backOpen = (backR >= 0 && backR < game.boardSize && 
                         backC >= 0 && backC < game.boardSize && 
                         game.board[backR][backC] === 0);

        return frontOpen || backOpen;  // 至少一端开放
    }

    /**
     * 检查是否是获胜的活四（两端都可以扩展或一端能立即获胜）
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} player 
     * @returns {boolean}
     */
    isWinningFour(game, row, col, dx, dy, player) {
        // 简化版：检查四连两端是否有空位
        const positions = [];

        // 找到四连的范围
        for (let i = -4; i <= 4; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            if (r >= 0 && r < game.boardSize && c >= 0 && c < game.boardSize) {
                positions.push([r, c, game.board[r][c]]);
            }
        }

        // 检查是否有连续四子且两端有空位
        let consecutiveCount = 0;
        for (let i = 0; i < positions.length; i++) {
            const [r, c, piece] = positions[i];
            if (piece === player) {
                consecutiveCount++;
                if (consecutiveCount >= 4) {
                    // 检查前后是否有空位
                    const startIdx = i - 3;
                    const endIdx = i + 1;

                    const frontFree = (startIdx >= 0 && 
                                      startIdx < positions.length && 
                                      positions[startIdx][2] === 0);

                    const backFree = (endIdx >= 0 && 
                                     endIdx < positions.length && 
                                     positions[endIdx][2] === 0);

                    return frontFree || backFree;
                }
            } else {
                consecutiveCount = 0;
            }
        }

        return false;
    }

    /**
     * 检查是否是有威胁的活三（能形成活四或获胜）
     * @param {GomokuGame} game 
     * @param {number} row 
     * @param {number} col 
     * @param {number} dx 
     * @param {number} dy 
     * @param {number} player 
     * @returns {boolean}
     */
    isLiveThreeThreat(game, row, col, dx, dy, player) {
        // 检查三连两端是否都有空位，且延伸后不被阻挡
        
        // 获取当前方向的一段棋子
        const linePieces = [];
        for (let i = -5; i <= 5; i++) {
            const r = row + i * dx;
            const c = col + i * dy;
            if (r >= 0 && r < game.boardSize && c >= 0 && c < game.boardSize) {
                linePieces.push(game.board[r][c]);
            } else {
                linePieces.push(-1);  // 边界
            }
        }

        // 在linePieces中找到当前位置
        const centerIdx = 5;  // 当前位置在linePieces中的索引

        // 检查是否能形成活四
        // 即三连的两端都有足够空间扩展
        let threeStart = null;
        let threeEnd = null;

        // 向前找三连的起始
        let consecutive = 1;  // 包含当前位置
        for (let i = centerIdx - 1; i >= 0; i--) {
            if (i < linePieces.length && linePieces[i] === player) {
                consecutive++;
                if (consecutive >= 3) {
                    threeStart = i;
                    break;
                }
            } else {
                break;
            }
        }

        // 向后找三连的结束
        consecutive = 1;
        for (let i = centerIdx + 1; i < linePieces.length; i++) {
            if (linePieces[i] === player) {
                consecutive++;
                if (consecutive >= 3) {
                    threeEnd = i;
                    break;
                }
            } else {
                break;
            }
        }

        // 如果找到了三连，检查两端是否可以扩展
        if (threeStart !== null && threeEnd !== null) {
            // 检查三连前后是否有空位
            const frontSpace = (threeStart > 0 && 
                               linePieces[threeStart - 1] === 0);
            const backSpace = (threeEnd < linePieces.length - 1 && 
                              linePieces[threeEnd + 1] === 0);

            // 活三需要至少一端可以扩展，且扩展后还有空间
            let frontSpace2 = false;
            if (frontSpace && threeStart > 1) {
                frontSpace2 = linePieces[threeStart - 2] === 0;
            }

            let backSpace2 = false;
            if (backSpace && threeEnd < linePieces.length - 2) {
                backSpace2 = linePieces[threeEnd + 2] === 0;
            }

            // 活三：两端都能扩展，或者一端能扩展且另一端不被阻挡
            return (frontSpace && backSpace) || (frontSpace && frontSpace2) || (backSpace && backSpace2);
        }

        return false;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GomokuAI;
} else {
    window.GomokuAI = GomokuAI;
}