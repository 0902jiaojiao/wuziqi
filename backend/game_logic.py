"""
五子棋游戏核心逻辑
"""

class GomokuGame:
    def __init__(self, board_size=15):
        """
        初始化五子棋游戏
        :param board_size: 棋盘大小，默认15x15
        """
        self.board_size = board_size
        self.board = [[0 for _ in range(board_size)] for _ in range(board_size)]
        self.current_player = 1  # 1为人类玩家(黑子)，2为AI玩家(白子)
        self.game_over = False
        self.winner = 0
        
    def reset_game(self):
        """重置游戏"""
        self.board = [[0 for _ in range(self.board_size)] for _ in range(self.board_size)]
        self.current_player = 1
        self.game_over = False
        self.winner = 0
        
    def is_valid_move(self, row, col):
        """
        检查落子是否有效
        :param row: 行坐标
        :param col: 列坐标
        :return: 是否有效
        """
        return (0 <= row < self.board_size and 
                0 <= col < self.board_size and 
                self.board[row][col] == 0 and 
                not self.game_over)
    
    def make_move(self, row, col, player=None):
        """
        落子
        :param row: 行坐标
        :param col: 列坐标
        :param player: 玩家编号，默认为当前玩家
        :return: 是否成功落子
        """
        if player is None:
            player = self.current_player
            
        if not self.is_valid_move(row, col):
            return False
            
        self.board[row][col] = player
        
        # 检查是否获胜
        if self.check_winner(row, col, player):
            self.game_over = True
            self.winner = player
        # 检查是否平局
        elif self.is_board_full():
            self.game_over = True
            self.winner = 0  # 平局
        else:
            # 切换玩家
            self.current_player = 3 - self.current_player
            
        return True
    
    def check_winner(self, row, col, player):
        """
        检查指定位置的落子是否形成五子连珠
        :param row: 行坐标
        :param col: 列坐标
        :param player: 玩家编号
        :return: 是否获胜
        """
        directions = [
            (0, 1),   # 水平
            (1, 0),   # 垂直
            (1, 1),   # 主对角线
            (1, -1)   # 副对角线
        ]
        
        for dx, dy in directions:
            count = 1  # 包含当前落子
            
            # 向一个方向检查
            x, y = row + dx, col + dy
            while (0 <= x < self.board_size and 
                   0 <= y < self.board_size and 
                   self.board[x][y] == player):
                count += 1
                x, y = x + dx, y + dy
                
            # 向相反方向检查
            x, y = row - dx, col - dy
            while (0 <= x < self.board_size and 
                   0 <= y < self.board_size and 
                   self.board[x][y] == player):
                count += 1
                x, y = x - dx, y - dy
                
            if count >= 5:
                return True
                
        return False
    
    def is_board_full(self):
        """检查棋盘是否已满"""
        for row in self.board:
            if 0 in row:
                return False
        return True
    
    def get_valid_moves(self):
        """获取所有有效的落子位置"""
        moves = []
        for i in range(self.board_size):
            for j in range(self.board_size):
                if self.board[i][j] == 0:
                    moves.append((i, j))
        return moves
    
    def get_board_state(self):
        """获取当前棋盘状态"""
        return {
            'board': self.board,
            'current_player': self.current_player,
            'game_over': self.game_over,
            'winner': self.winner,
            'board_size': self.board_size
        }
    
    def copy(self):
        """创建游戏状态的副本"""
        new_game = GomokuGame(self.board_size)
        new_game.board = [row[:] for row in self.board]
        new_game.current_player = self.current_player
        new_game.game_over = self.game_over
        new_game.winner = self.winner
        return new_game