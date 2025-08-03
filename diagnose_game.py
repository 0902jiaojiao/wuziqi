#!/usr/bin/env python3
"""
五子棋游戏状态诊断工具
"""

import requests
import json

def check_server():
    """检查服务器状态"""
    try:
        response = requests.get('http://localhost:5001/api/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ 服务器状态：正常")
            print(f"   活跃游戏数：{data.get('active_games', 0)}")
            return True
        else:
            print(f"❌ 服务器状态异常：{response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 无法连接服务器：{e}")
        return False

def create_test_game():
    """创建测试游戏"""
    try:
        response = requests.post(
            'http://localhost:5001/api/new_game',
            json={"difficulty": 2, "board_size": 15},
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print("✅ 测试游戏创建成功")
            print(f"   游戏ID：{data['game_id']}")
            print(f"   当前玩家：{data['board_state']['current_player']}")
            return data['game_id']
        else:
            print(f"❌ 创建游戏失败：{response.text}")
            return None
    except Exception as e:
        print(f"❌ 创建游戏请求失败：{e}")
        return None

def test_move(game_id, row, col):
    """测试落子"""
    try:
        response = requests.post(
            'http://localhost:5001/api/make_move',
            json={"game_id": game_id, "row": row, "col": col},
            timeout=10
        )
        print(f"\n测试落子 ({row}, {col}):")
        print(f"   状态码：{response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ 落子成功")
            print(f"   当前玩家：{data['board_state']['current_player']}")
            if data.get('ai_move'):
                print(f"   AI落子：({data['ai_move']['row']}, {data['ai_move']['col']})")
        else:
            data = response.json()
            print(f"❌ 落子失败：{data.get('message', '未知错误')}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"❌ 落子请求失败：{e}")
        return False

def main():
    print("=== 五子棋游戏诊断工具 ===\n")
    
    # 1. 检查服务器
    print("1. 检查服务器连接...")
    if not check_server():
        print("\n🚨 服务器连接失败，请检查后端是否启动")
        return
    
    # 2. 创建测试游戏
    print("\n2. 创建测试游戏...")
    game_id = create_test_game()
    if not game_id:
        print("\n🚨 无法创建游戏")
        return
    
    # 3. 测试落子
    print("\n3. 测试落子功能...")
    test_moves = [
        (7, 7),   # 中心位置
        (6, 6),   # 左上
        (8, 8),   # 右下
    ]
    
    success_count = 0
    for row, col in test_moves:
        if test_move(game_id, row, col):
            success_count += 1
    
    # 4. 结果总结
    print(f"\n=== 诊断结果 ===")
    print(f"✅ 服务器连接：正常")
    print(f"✅ 游戏创建：正常")
    print(f"✅ 落子测试：{success_count}/{len(test_moves)} 成功")
    
    if success_count == len(test_moves):
        print("\n🎉 所有测试通过！游戏功能正常")
        print("\n建议：")
        print("1. 在微信小程序中点击'新游戏'重新开始")
        print("2. 如果仍有问题，点击'同步'按钮")
        print("3. 确保微信开发者工具已关闭域名校验")
    else:
        print("\n⚠️ 部分测试失败，可能的原因：")
        print("1. 游戏状态不同步")
        print("2. 网络连接不稳定")
        print("3. 前端发送的数据格式有误")
        print("\n建议：")
        print("1. 重启后端服务器")
        print("2. 检查网络配置")
        print("3. 查看服务器日志")

if __name__ == '__main__':
    main()