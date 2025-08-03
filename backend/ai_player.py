"""
五子棋AI玩家实现
使用Minimax算法配合Alpha-Beta剪枝和启发式评估函数
"""

import random
from game_logic import GomokuGame

class GomokuAI:
    def __init__(self, difficulty=3):
        """
        初始化AI玩家
        :param difficulty: 难度等级 (1-5)，影响搜索深度
        """
        self.difficulty = difficulty
        # 增加搜索深度，让AI更聪明
        depth_map = {1: 2, 2: 3, 3: 4, 4: 6, 5: 8}
        self.max_depth = depth_map.get(difficulty, 4)
        self.ai_player = 2  # AI是白子
        self.human_player = 1  # 人类是黑子
        
    def get_best_move(self, game):
        """
        获取AI的最佳落子位置
        :param game: GomokuGame实例
        :return: (row, col) 最佳位置
        """
        if self.is_opening_move(game):
            return self.get_opening_move(game)
            
        # 使用Minimax算法寻找最佳落子
        _, best_move = self.minimax(game, self.max_depth, True, float('-inf'), float('inf'))
        return best_move
    
    def is_opening_move(self, game):
        """检查是否是开局阶段"""
        total_pieces = sum(sum(1 for cell in row if cell != 0) for row in game.board)
        return total_pieces <= 2
    
    def get_opening_move(self, game):
        """获取开局落子"""
        center = game.board_size // 2
        
        # 如果是第一步，下在中心
        if all(cell == 0 for row in game.board for cell in row):
            return (center, center)
        
        # 如果中心已有子，在附近下子
        nearby_positions = [
            (center-1, center-1), (center-1, center), (center-1, center+1),
            (center, center-1), (center, center+1),
            (center+1, center-1), (center+1, center), (center+1, center+1)
        ]
        
        valid_positions = [(r, c) for r, c in nearby_positions 
                          if game.is_valid_move(r, c)]
        
        return random.choice(valid_positions) if valid_positions else self.get_random_move(game)
    
    def get_random_move(self, game):
        """获取随机有效落子位置"""
        valid_moves = game.get_valid_moves()
        return random.choice(valid_moves) if valid_moves else None
    
    def minimax(self, game, depth, maximizing_player, alpha, beta):
        """
        Minimax算法配合Alpha-Beta剪枝
        :param game: 游戏状态
        :param depth: 搜索深度
        :param maximizing_player: 是否是最大化玩家
        :param alpha: Alpha值
        :param beta: Beta值
        :return: (评估分数, 最佳落子位置)
        """
        if depth == 0 or game.game_over:
            return self.evaluate_board(game), None
        
        # 获取候选落子位置（减少搜索空间）
        candidate_moves = self.get_candidate_moves(game)
        
        if maximizing_player:
            max_eval = float('-inf')
            best_move = None
            
            # 首先检查是否有直接获胜的机会
            for row, col in candidate_moves:
                game_copy = game.copy()
                game_copy.make_move(row, col, self.ai_player)
                
                # 如果这步棋直接获胜，立即返回最高分数
                if game_copy.game_over and game_copy.winner == self.ai_player:
                    return 100000, (row, col)  # 确保优先选择获胜棋步
                
                eval_score, _ = self.minimax(game_copy, depth - 1, False, alpha, beta)
                
                if eval_score > max_eval:
                    max_eval = eval_score
                    best_move = (row, col)
                
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break  # Alpha-Beta剪枝
                    
            return max_eval, best_move
        else:
            min_eval = float('inf')
            best_move = None
            
            # 检查是否需要阻止对手获胜
            for row, col in candidate_moves:
                game_copy = game.copy()
                game_copy.make_move(row, col, self.human_player)
                
                # 如果对手这步棋直接获胜，给予极低分数
                if game_copy.game_over and game_copy.winner == self.human_player:
                    eval_score = -100000  # 必须阻止对手获胜
                else:
                    eval_score, _ = self.minimax(game_copy, depth - 1, True, alpha, beta)
                
                if eval_score < min_eval:
                    min_eval = eval_score
                    best_move = (row, col)
                
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break  # Alpha-Beta剪枝
                    
            return min_eval, best_move
    
    def get_candidate_moves(self, game):
        """
        智能获取候选落子位置，优先考虑威胁和防守
        """
        # 如果棋盘为空，选择中心
        if all(game.board[i][j] == 0 for i in range(game.board_size) for j in range(game.board_size)):
            center = game.board_size // 2
            return [(center, center)]
        
        # 1. 寻找关键位置（必须防守或攻击）
        critical_moves = self.find_critical_positions(game)
        if critical_moves:
            return critical_moves[:5]  # 关键位置优先
        
        # 2. 寻找有价值的位置
        valuable_moves = []
        
        # 只考虑已有棋子周围1-2格的位置
        candidates = set()
        for i in range(game.board_size):
            for j in range(game.board_size):
                if game.board[i][j] != 0:
                    # 周围1格必须考虑，2格选择性考虑
                    for di in range(-2, 3):
                        for dj in range(-2, 3):
                            ni, nj = i + di, j + dj
                            if (0 <= ni < game.board_size and 
                                0 <= nj < game.board_size and 
                                game.board[ni][nj] == 0):
                                # 优先考虑直接相邻的位置
                                if abs(di) <= 1 and abs(dj) <= 1:
                                    candidates.add((ni, nj))
                                elif abs(di) <= 2 and abs(dj) <= 2:
                                    # 2格范围内的位置需要有更多邻居才考虑
                                    neighbor_count = self.count_neighbors(game, ni, nj)
                                    if neighbor_count >= 2:
                                        candidates.add((ni, nj))
        
        # 评估每个候选位置的价值
        for row, col in candidates:
            value = self.evaluate_position_value(game, row, col)
            if value > 0:
                valuable_moves.append((row, col, value))
        
        # 按价值排序
        valuable_moves.sort(key=lambda x: x[2], reverse=True)
        
        # 返回前10个最有价值的位置
        result = [(move[0], move[1]) for move in valuable_moves[:10]]
        
        # 如果没有找到有价值的位置，返回基本候选
        if not result:
            result = list(candidates)[:15]
        
        return result if result else game.get_valid_moves()[:10]
    
    def sort_moves_by_priority(self, game, moves):
        """按优先级排序落子位置"""
        def move_priority(move):
            row, col = move
            # 简单的位置评分：靠近中心和已有棋子的位置优先级更高
            center = game.board_size // 2
            center_distance = abs(row - center) + abs(col - center)
            
            # 检查周围是否有棋子
            neighbor_count = 0
            for di in range(-1, 2):
                for dj in range(-1, 2):
                    ni, nj = row + di, col + dj
                    if (0 <= ni < game.board_size and 
                        0 <= nj < game.board_size and 
                        game.board[ni][nj] != 0):
                        neighbor_count += 1
            
            return -neighbor_count * 10 - center_distance  # 负数因为我们要降序排列
        
        return sorted(moves, key=move_priority, reverse=True)
    
    def evaluate_board(self, game):
        """
        评估棋盘局面
        :param game: 游戏状态
        :return: 评估分数（正数对AI有利，负数对人类有利）
        """
        if game.game_over:
            if game.winner == self.ai_player:
                return 10000
            elif game.winner == self.human_player:
                return -10000
            else:
                return 0  # 平局
        
        # 增强评估：优先考虑攻防威胁
        ai_score = self.evaluate_player_enhanced(game, self.ai_player)
        human_score = self.evaluate_player_enhanced(game, self.human_player)
        
        # 加重防守权重：防止对手获胜比自己获胜更重要
        defense_bonus = self.check_immediate_threats(game, self.human_player) * -1500
        attack_bonus = self.check_immediate_threats(game, self.ai_player) * 1200
        
        return ai_score - human_score * 1.1 + defense_bonus + attack_bonus
    
    def evaluate_player(self, game, player):
        """评估某个玩家的局面分数"""
        score = 0
        
        # 检查所有方向的连子情况
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        for i in range(game.board_size):
            for j in range(game.board_size):
                if game.board[i][j] == player:
                    for dx, dy in directions:
                        score += self.evaluate_line(game, i, j, dx, dy, player)
        
        return score
    
    def evaluate_line(self, game, row, col, dx, dy, player):
        """评估从某个位置开始某个方向的连线价值"""
        score = 0
        
        # 向前看5个位置
        line = []
        for k in range(5):
            r, c = row + k * dx, col + k * dy
            if 0 <= r < game.board_size and 0 <= c < game.board_size:
                line.append(game.board[r][c])
            else:
                line.append(-1)  # 边界标记
        
        # 评估这条线的价值
        if len(line) == 5:
            score += self.score_line(line, player)
        
        return score
    
    def score_line(self, line, player):
        """为5个位置的线段打分"""
        if len(line) != 5:
            return 0
        
        # 统计己方棋子和空位
        my_count = line.count(player)
        empty_count = line.count(0)
        opponent = 3 - player
        opponent_count = line.count(opponent)
        
        # 如果有对方棋子，这条线无价值
        if opponent_count > 0:
            return 0
        
        # 根据己方棋子数量给分
        if my_count == 5:
            return 1000  # 五连
        elif my_count == 4 and empty_count == 1:
            return 100   # 活四
        elif my_count == 3 and empty_count == 2:
            return 10    # 活三
        elif my_count == 2 and empty_count == 3:
            return 1     # 活二
        
        return 0
    
    def evaluate_player_enhanced(self, game, player):
        """增强的玩家评估函数"""
        score = 0
        
        # 检查所有方向的连子情况
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        for i in range(game.board_size):
            for j in range(game.board_size):
                if game.board[i][j] == player:
                    for dx, dy in directions:
                        score += self.evaluate_line_enhanced(game, i, j, dx, dy, player)
        
        return score
    
    def evaluate_line_enhanced(self, game, row, col, dx, dy, player):
        """增强的连线评估"""
        score = 0
        
        # 检查不同长度的连子模式
        for length in range(2, 6):  # 检查2-5连
            for start_offset in range(-length + 1, 1):
                line = []
                for k in range(length):
                    r = row + (start_offset + k) * dx
                    c = col + (start_offset + k) * dy
                    if 0 <= r < game.board_size and 0 <= c < game.board_size:
                        line.append(game.board[r][c])
                    else:
                        line.append(-1)  # 边界
                
                if len(line) == length:
                    score += self.score_pattern(line, player, length)
        
        return score
    
    def score_pattern(self, line, player, length):
        """为特定模式打分"""
        my_count = line.count(player)
        empty_count = line.count(0)
        opponent = 3 - player
        opponent_count = line.count(opponent)
        
        # 如果有对手棋子，这个模式无价值
        if opponent_count > 0:
            return 0
        
        # 根据连子数量和空位给分
        if length == 5:
            if my_count == 5:
                return 10000  # 五连胜利
            elif my_count == 4 and empty_count == 1:
                return 1000   # 活四
            elif my_count == 3 and empty_count == 2:
                return 100    # 活三
            elif my_count == 2 and empty_count == 3:
                return 10     # 活二
        elif length == 4:
            if my_count == 4:
                return 800    # 冲四
            elif my_count == 3 and empty_count == 1:
                return 50     # 冲三
            elif my_count == 2 and empty_count == 2:
                return 5      # 活二
        elif length == 3:
            if my_count == 3:
                return 200    # 连三
            elif my_count == 2 and empty_count == 1:
                return 2      # 连二
        
        return 0
    
    def check_immediate_threats(self, game, player):
        """检查立即威胁（四连、活三等）"""
        threat_count = 0
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        for i in range(game.board_size):
            for j in range(game.board_size):
                if game.board[i][j] == 0:  # 空位
                    # 模拟在这个位置放子
                    game.board[i][j] = player
                    
                    # 检查是否形成威胁
                    for dx, dy in directions:
                        count = self.count_consecutive(game, i, j, dx, dy, player)
                        if count >= 4:  # 四连或以上
                            threat_count += 1
                        elif count == 3:  # 三连，检查是否是活三
                            if self.is_live_three(game, i, j, dx, dy, player):
                                threat_count += 1
                    
                    # 恢复空位
                    game.board[i][j] = 0
        
        return threat_count
    
    def count_consecutive(self, game, row, col, dx, dy, player):
        """计算连续棋子数量"""
        count = 1  # 包含当前位置
        
        # 向前计数
        r, c = row + dx, col + dy
        while (0 <= r < game.board_size and 0 <= c < game.board_size and 
               game.board[r][c] == player):
            count += 1
            r, c = r + dx, c + dy
        
        # 向后计数
        r, c = row - dx, col - dy
        while (0 <= r < game.board_size and 0 <= c < game.board_size and 
               game.board[r][c] == player):
            count += 1
            r, c = r - dx, c - dy
        
        return count
    
    def is_live_three(self, game, row, col, dx, dy, player):
        """检查是否是活三（两端都可以扩展）"""
        # 检查三连的两端是否都是空位
        front_r, front_c = row + 4 * dx, col + 4 * dy
        back_r, back_c = row - dx, col - dy
        
        front_empty = (0 <= front_r < game.board_size and 
                      0 <= front_c < game.board_size and 
                      game.board[front_r][front_c] == 0)
        
        back_empty = (0 <= back_r < game.board_size and 
                     0 <= back_c < game.board_size and 
                     game.board[back_r][back_c] == 0)
        
        return front_empty and back_empty
    
    def find_critical_positions(self, game):
        """寻找关键位置：必须防守或可以获胜的位置"""
        critical = []
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        for i in range(game.board_size):
            for j in range(game.board_size):
                if game.board[i][j] == 0:
                    # 检查防守价值（阻止对手）
                    game.board[i][j] = self.human_player
                    defense_value = 0
                    
                    for dx, dy in directions:
                        count = self.count_consecutive(game, i, j, dx, dy, self.human_player)
                        if count >= 5:
                            defense_value = 50000  # 必须防守，立即获胜
                            break
                        elif count == 4:
                            # 检查是否是真正的活四
                            if self.is_winning_four(game, i, j, dx, dy, self.human_player):
                                defense_value = max(defense_value, 40000)  # 必须防守的活四
                            else:
                                defense_value = max(defense_value, 8000)   # 冲四也要防
                        elif count == 3:
                            # 检查是否是活三
                            if self.is_live_three_threat(game, i, j, dx, dy, self.human_player):
                                defense_value = max(defense_value, 3000)  # 活三威胁
                            else:
                                defense_value = max(defense_value, 500)   # 普通三连
                    
                    game.board[i][j] = 0  # 恢复
                    
                    # 检查攻击价值（AI自己）
                    game.board[i][j] = self.ai_player
                    attack_value = 0
                    
                    for dx, dy in directions:
                        count = self.count_consecutive(game, i, j, dx, dy, self.ai_player)
                        if count >= 5:
                            attack_value = 100000  # 直接获胜，最高优先级
                            break
                        elif count == 4:
                            # 检查是否是获胜的活四
                            if self.is_winning_four(game, i, j, dx, dy, self.ai_player):
                                attack_value = max(attack_value, 80000)  # 活四获胜
                            else:
                                attack_value = max(attack_value, 15000)  # 冲四
                        elif count == 3:
                            # 检查是否是活三
                            if self.is_live_three_threat(game, i, j, dx, dy, self.ai_player):
                                attack_value = max(attack_value, 5000)   # 活三
                            else:
                                attack_value = max(attack_value, 1000)   # 普通三连
                    
                    game.board[i][j] = 0  # 恢复
                    
                    # 攻击优先，但防守也很重要
                    total_value = attack_value + defense_value * 0.9
                    
                    if total_value >= 1000:  # 重要位置阈值
                        critical.append((i, j, total_value))
        
        # 按重要性排序
        critical.sort(key=lambda x: x[2], reverse=True)
        return [(pos[0], pos[1]) for pos in critical]
    
    def evaluate_position_value(self, game, row, col):
        """评估位置的具体价值"""
        if game.board[row][col] != 0:
            return 0
        
        value = 0
        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        
        # 检查邻居密度（鼓励紧凑布局）
        neighbor_count = self.count_neighbors(game, row, col)
        if neighbor_count == 0:
            return 0  # 不考虑孤立位置
        
        value += neighbor_count * 20  # 基础紧凑性奖励
        
        # 评估在每个方向的连子潜力
        for dx, dy in directions:
            # AI连子潜力
            ai_potential = self.calculate_direction_potential(game, row, col, dx, dy, self.ai_player)
            value += ai_potential * 2
            
            # 阻止对手潜力
            human_potential = self.calculate_direction_potential(game, row, col, dx, dy, self.human_player)
            value += human_potential * 1.5
        
        # 位置偏好（略微偏向中心）
        center = game.board_size // 2
        center_distance = abs(row - center) + abs(col - center)
        value += max(0, 5 - center_distance)
        
        return value
    
    def count_neighbors(self, game, row, col):
        """计算某位置周围的棋子数量"""
        count = 0
        for di in [-1, 0, 1]:
            for dj in [-1, 0, 1]:
                if di == 0 and dj == 0:
                    continue
                ni, nj = row + di, col + dj
                if (0 <= ni < game.board_size and 
                    0 <= nj < game.board_size and 
                    game.board[ni][nj] != 0):
                    count += 1
        return count
    
    def calculate_direction_potential(self, game, row, col, dx, dy, player):
        """计算在特定方向的连子潜力"""
        # 模拟放子
        game.board[row][col] = player
        
        # 计算连子数
        consecutive = self.count_consecutive(game, row, col, dx, dy, player)
        
        # 恢复
        game.board[row][col] = 0
        
        # 根据连子数评分
        if consecutive >= 5:
            return 10000
        elif consecutive == 4:
            # 检查是否被封死
            return 1000 if self.check_open_ends(game, row, col, dx, dy, consecutive) else 500
        elif consecutive == 3:
            return 200 if self.check_open_ends(game, row, col, dx, dy, consecutive) else 100
        elif consecutive == 2:
            return 20 if self.check_open_ends(game, row, col, dx, dy, consecutive) else 10
        else:
            return 0
    
    def check_open_ends(self, game, row, col, dx, dy, length):
        """检查连子两端是否有空位（简化版）"""
        # 检查前端
        front_r = row + length * dx
        front_c = col + length * dy
        front_open = (0 <= front_r < game.board_size and 
                     0 <= front_c < game.board_size and 
                     game.board[front_r][front_c] == 0)
        
        # 检查后端
        back_r = row - dx
        back_c = col - dy
        back_open = (0 <= back_r < game.board_size and 
                    0 <= back_c < game.board_size and 
                    game.board[back_r][back_c] == 0)
        
        return front_open or back_open  # 至少一端开放
    
    def is_winning_four(self, game, row, col, dx, dy, player):
        """检查是否是获胜的活四（两端都可以扩展或一端能立即获胜）"""
        # 检查四连两端的情况
        positions = []
        
        # 找到四连的所有位置
        current_pos = []
        for i in range(-4, 5):
            r, c = row + i * dx, col + i * dy
            if (0 <= r < game.board_size and 0 <= c < game.board_size):
                current_pos.append((r, c, game.board[r][c]))
        
        # 找连续的四子
        consecutive_count = 0
        for i, (r, c, piece) in enumerate(current_pos):
            if piece == player:
                consecutive_count += 1
                if consecutive_count >= 4:
                    # 检查前后是否有空位形成活四
                    start_idx = i - 3
                    end_idx = i + 1
                    
                    front_free = (start_idx >= 0 and 
                                 start_idx < len(current_pos) and 
                                 current_pos[start_idx][2] == 0)
                    
                    back_free = (end_idx >= 0 and 
                                end_idx < len(current_pos) and 
                                current_pos[end_idx][2] == 0)
                    
                    return front_free or back_free
            else:
                consecutive_count = 0
        
        return False
    
    def is_live_three_threat(self, game, row, col, dx, dy, player):
        """检查是否是有威胁的活三（能形成活四或获胜）"""
        # 检查三连两端是否都有空位，且延伸后不被阻挡
        
        # 获取当前方向的一段棋子
        line_pieces = []
        for i in range(-5, 6):
            r, c = row + i * dx, col + i * dy
            if 0 <= r < game.board_size and 0 <= c < game.board_size:
                line_pieces.append(game.board[r][c])
            else:
                line_pieces.append(-1)  # 边界
        
        # 在line_pieces中找到当前位置
        center_idx = 5  # 当前位置在line_pieces中的索引
        
        # 检查是否能形成活四
        # 即三连的两端都有足够空间扩展
        three_start = None
        three_end = None
        
        # 向前找三连的起始
        consecutive = 1  # 包含当前位置
        for i in range(center_idx - 1, -1, -1):
            if i < len(line_pieces) and line_pieces[i] == player:
                consecutive += 1
                if consecutive >= 3:
                    three_start = i
                    break
            else:
                break
        
        # 向后找三连的结束
        consecutive = 1
        for i in range(center_idx + 1, len(line_pieces)):
            if line_pieces[i] == player:
                consecutive += 1
                if consecutive >= 3:
                    three_end = i
                    break
            else:
                break
        
        # 如果找到了三连，检查两端是否可以扩展
        if three_start is not None and three_end is not None:
            # 检查三连前后是否有空位
            front_space = (three_start > 0 and 
                          line_pieces[three_start - 1] == 0)
            back_space = (three_end < len(line_pieces) - 1 and 
                         line_pieces[three_end + 1] == 0)
            
            # 活三需要至少一端可以扩展，且扩展后还有空间
            if front_space and three_start > 1:
                front_space2 = line_pieces[three_start - 2] == 0
            else:
                front_space2 = False
                
            if back_space and three_end < len(line_pieces) - 2:
                back_space2 = line_pieces[three_end + 2] == 0
            else:
                back_space2 = False
            
            # 活三：两端都能扩展，或者一端能扩展且另一端不被阻挡
            return (front_space and back_space) or (front_space and front_space2) or (back_space and back_space2)
        
        return False