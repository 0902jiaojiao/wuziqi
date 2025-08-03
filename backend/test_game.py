#!/usr/bin/env python3
"""
五子棋游戏测试脚本
"""

from game_logic import GomokuGame
from ai_player import GomokuAI

def test_game_basic():
    """测试基本游戏功能"""
    print("=== 测试基本游戏功能 ===")
    
    # 创建游戏
    game = GomokuGame(15)
    print(f"✓ 游戏创建成功，棋盘大小: {game.board_size}x{game.board_size}")
    
    # 测试落子
    assert game.make_move(7, 7, 1) == True
    print("✓ 玩家落子成功")
    
    # 测试重复落子
    assert game.make_move(7, 7, 2) == False
    print("✓ 重复落子检测正常")
    
    # 测试边界
    assert game.make_move(-1, 0, 1) == False
    assert game.make_move(15, 0, 1) == False
    print("✓ 边界检测正常")
    
    print("基本游戏功能测试通过！\n")

def test_ai_basic():
    """测试AI基本功能"""
    print("=== 测试AI基本功能 ===")
    
    # 创建AI
    ai = GomokuAI(difficulty=2)
    print("✓ AI创建成功")
    
    # 创建游戏
    game = GomokuGame(15)
    
    # AI第一步
    ai_move = ai.get_best_move(game)
    assert ai_move is not None
    print(f"✓ AI第一步: ({ai_move[0]}, {ai_move[1]})")
    
    # 执行AI落子
    game.make_move(ai_move[0], ai_move[1], 2)
    
    # 玩家落子
    game.make_move(7, 8, 1)
    
    # AI第二步
    ai_move2 = ai.get_best_move(game)
    assert ai_move2 is not None
    print(f"✓ AI第二步: ({ai_move2[0]}, {ai_move2[1]})")
    
    print("AI基本功能测试通过！\n")

def test_win_condition():
    """测试获胜条件"""
    print("=== 测试获胜条件 ===")
    
    game = GomokuGame(15)
    
    # 创建水平五连
    for i in range(5):
        game.make_move(7, 7 + i, 1)
        if game.game_over:
            break
    
    assert game.game_over == True
    assert game.winner == 1
    print("✓ 水平五连检测正常")
    
    # 重置游戏测试垂直五连
    game.reset_game()
    for i in range(5):
        game.make_move(7 + i, 7, 1)
        if game.game_over:
            break
    
    assert game.game_over == True
    assert game.winner == 1
    print("✓ 垂直五连检测正常")
    
    print("获胜条件测试通过！\n")

def simulate_game():
    """模拟一局完整游戏"""
    print("=== 模拟完整游戏 ===")
    
    game = GomokuGame(15)
    ai = GomokuAI(difficulty=2)
    
    move_count = 0
    max_moves = 50  # 限制最大步数
    
    print("游戏开始！玩家是黑子(1)，AI是白子(2)")
    
    while not game.game_over and move_count < max_moves:
        if game.current_player == 1:
            # 玩家随机落子（模拟）
            valid_moves = game.get_valid_moves()
            if not valid_moves:
                break
            import random
            move = random.choice(valid_moves)
            game.make_move(move[0], move[1], 1)
            print(f"玩家落子: ({move[0]}, {move[1]})")
        else:
            # AI落子
            ai_move = ai.get_best_move(game)
            if ai_move:
                game.make_move(ai_move[0], ai_move[1], 2)
                print(f"AI落子: ({ai_move[0]}, {ai_move[1]})")
            else:
                break
        
        move_count += 1
    
    if game.game_over:
        if game.winner == 1:
            print("✓ 游戏结束：玩家获胜！")
        elif game.winner == 2:
            print("✓ 游戏结束：AI获胜！")
        else:
            print("✓ 游戏结束：平局！")
    else:
        print(f"✓ 游戏进行了{move_count}步后结束")
    
    print("完整游戏模拟完成！\n")

def main():
    """主测试函数"""
    print("五子棋游戏测试开始...\n")
    
    try:
        test_game_basic()
        test_ai_basic()
        test_win_condition()
        simulate_game()
        
        print("🎉 所有测试通过！游戏系统运行正常！")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()