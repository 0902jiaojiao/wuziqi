"""
五子棋微信小程序后端服务器
使用Flask提供API接口供微信小程序调用
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import uuid
from game_logic import GomokuGame
from ai_player import GomokuAI

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 存储游戏会话的字典
game_sessions = {}

@app.route('/api/new_game', methods=['POST'])
def new_game():
    """创建新游戏"""
    try:
        data = request.get_json() or {}
        difficulty = data.get('difficulty', 3)  # 默认中等难度
        board_size = data.get('board_size', 15)  # 默认15x15棋盘
        
        # 创建游戏实例
        game = GomokuGame(board_size)
        ai = GomokuAI(difficulty)
        
        # 生成游戏ID
        game_id = str(uuid.uuid4())
        
        # 存储游戏会话
        game_sessions[game_id] = {
            'game': game,
            'ai': ai,
            'created_at': json.dumps(data.get('timestamp', '')),
            'hint_used': False  # 追踪提示是否已使用
        }
        
        return jsonify({
            'success': True,
            'game_id': game_id,
            'board_state': game.get_board_state(),
            'message': '新游戏创建成功'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '创建游戏失败'
        }), 500

@app.route('/api/make_move', methods=['POST'])
def make_move():
    """玩家落子"""
    try:
        data = request.get_json()
        game_id = data.get('game_id')
        row = data.get('row')
        col = data.get('col')
        
        if not game_id or game_id not in game_sessions:
            return jsonify({
                'success': False,
                'error': 'Invalid game_id',
                'message': '游戏会话不存在'
            }), 400
        
        if row is None or col is None:
            return jsonify({
                'success': False,
                'error': 'Missing coordinates',
                'message': '缺少落子坐标'
            }), 400
        
        session = game_sessions[game_id]
        game = session['game']
        ai = session['ai']
        
        # 检查是否轮到玩家
        if game.current_player != 1:
            return jsonify({
                'success': False,
                'error': 'Not player turn',
                'message': '现在不是玩家回合'
            }), 400
        
        # 玩家落子
        if not game.make_move(row, col, 1):
            return jsonify({
                'success': False,
                'error': 'Invalid move',
                'message': '无效的落子位置'
            }), 400
        
        response_data = {
            'success': True,
            'board_state': game.get_board_state(),
            'player_move': {'row': row, 'col': col},
            'ai_move': None,
            'message': '落子成功'
        }
        
        # 如果游戏未结束且轮到AI，让AI落子
        if not game.game_over and game.current_player == 2:
            import time
            # AI思考时间：可配置的速度
            speed_setting = data.get('ai_speed', 2)  # 默认普通速度
            speed_times = [0.2, 0.8, 1.5, 2.5, 4.0]  # 对应极速到深思
            thinking_time = speed_times[min(speed_setting, 4)]
            time.sleep(thinking_time)
            
            ai_move = ai.get_best_move(game)
            if ai_move:
                ai_row, ai_col = ai_move
                game.make_move(ai_row, ai_col, 2)
                response_data['ai_move'] = {'row': ai_row, 'col': ai_col}
                response_data['ai_thinking_time'] = thinking_time  # 返回思考时间
                response_data['board_state'] = game.get_board_state()
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '落子操作失败'
        }), 500

@app.route('/api/get_board_state', methods=['GET'])
def get_board_state():
    """获取棋盘状态"""
    try:
        game_id = request.args.get('game_id')
        
        if not game_id or game_id not in game_sessions:
            return jsonify({
                'success': False,
                'error': 'Invalid game_id',
                'message': '游戏会话不存在'
            }), 400
        
        game = game_sessions[game_id]['game']
        
        return jsonify({
            'success': True,
            'board_state': game.get_board_state(),
            'message': '获取棋盘状态成功'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '获取棋盘状态失败'
        }), 500

@app.route('/api/reset_game', methods=['POST'])
def reset_game():
    """重置游戏"""
    try:
        data = request.get_json()
        game_id = data.get('game_id')
        
        if not game_id or game_id not in game_sessions:
            return jsonify({
                'success': False,
                'error': 'Invalid game_id',
                'message': '游戏会话不存在'
            }), 400
        
        game = game_sessions[game_id]['game']
        game.reset_game()
        
        # 重置提示使用状态
        game_sessions[game_id]['hint_used'] = False
        
        return jsonify({
            'success': True,
            'board_state': game.get_board_state(),
            'message': '游戏重置成功',
            'hints_remaining': 1  # 重置后提示次数恢复为1
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '重置游戏失败'
        }), 500

@app.route('/api/ai_hint', methods=['GET'])
def ai_hint():
    """获取AI提示"""
    try:
        game_id = request.args.get('game_id')
        
        if not game_id or game_id not in game_sessions:
            return jsonify({
                'success': False,
                'error': 'Invalid game_id',
                'message': '游戏会话不存在'
            }), 400
        
        session = game_sessions[game_id]
        game = session['game']
        ai = session['ai']
        
        # 检查提示是否已使用
        if session.get('hint_used', False):
            return jsonify({
                'success': False,
                'error': 'hint_already_used',
                'message': '每局游戏只能使用一次提示'
            }), 400
        
        # 检查是否轮到玩家下棋
        if game.current_player != 1:  # 1是玩家
            return jsonify({
                'success': False,
                'error': 'not_player_turn',
                'message': '不是玩家回合，无法使用提示'
            }), 400
        
        # 检查游戏是否已结束
        if game.game_over:
            return jsonify({
                'success': False,
                'error': 'game_over',
                'message': '游戏已结束，无法使用提示'
            }), 400
        
        # 创建游戏副本让AI分析
        game_copy = game.copy()
        hint_move = ai.get_best_move(game_copy)
        
        if hint_move:
            # 标记提示已使用
            session['hint_used'] = True
            
            return jsonify({
                'success': True,
                'hint_move': {'row': hint_move[0], 'col': hint_move[1]},
                'message': 'AI提示获取成功（本局仅剩0次）',
                'hints_remaining': 0  # 剩余提示次数
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No valid moves',
                'message': '没有可用的落子位置'
            }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': '获取AI提示失败'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'success': True,
        'message': '服务器运行正常',
        'active_games': len(game_sessions)
    })

# 清理过期游戏会话的后台任务
def cleanup_expired_sessions():
    """清理超过1小时的游戏会话"""
    import time
    current_time = time.time()
    expired_sessions = []
    
    for game_id, session in game_sessions.items():
        # 这里可以添加基于时间的清理逻辑
        # 简单起见，当前不实现自动清理
        pass
    
    for game_id in expired_sessions:
        del game_sessions[game_id]

if __name__ == '__main__':
    print("五子棋微信小程序后端服务器启动中...")
    print("API接口说明:")
    print("- POST /api/new_game - 创建新游戏")
    print("- POST /api/make_move - 玩家落子")
    print("- GET /api/get_board_state - 获取棋盘状态")
    print("- POST /api/reset_game - 重置游戏")
    print("- GET /api/ai_hint - 获取AI提示")
    print("- GET /api/health - 健康检查")
    
    # 支持Railway等云平台的PORT环境变量
    import os
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(debug=debug, host='0.0.0.0', port=port)