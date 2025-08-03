/**
 * 五子棋AI 3D静态版本 - 主游戏控制器
 * 基于原始website/script3d.js改写，移除后端依赖，集成本地AI
 */

class StaticGomoku3D {
    constructor() {
        this.boardSize = 15;
        
        // 游戏状态
        this.game = new GomokuGame(this.boardSize);
        this.ai = new GomokuAI(3); // 默认困难难度
        this.hintMove = null;
        this.hintsRemaining = 1;
        this.isProcessing = false;
        this.lastAiMove = null;
        this.moveHistory = []; // 用于悔棋功能
        
        // Three.js 相关
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.boardGroup = null;
        this.piecesGroup = null;
        this.intersectionPoints = [];
        this.raycaster = null;
        this.mouse = null;
        this.hoveredIntersection = null;
        
        // 材质和几何体
        this.materials = {};
        this.geometries = {};
        
        // 相机预设
        this.cameraPresets = {
            default: { position: [10, 8, 10], target: [0, 0, 0] },
            top: { position: [0, 15, 0], target: [0, 0, 0] },
            angle: { position: [8, 12, 8], target: [0, 0, 0] },
            close: { position: [6, 4, 6], target: [0, 0, 0] }
        };
        
        this.init3DScene();
        this.setupEventListeners();
        this.updateStatus();
        this.showToast('3D五子棋已就绪！点击棋盘交叉点开始游戏', 3000);
    }

    /**
     * 初始化3D场景
     */
    init3DScene() {
        const container = document.getElementById('gameScene');
        
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f8ff);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0xf0f8ff);
        container.appendChild(this.renderer.domElement);
        
        // 创建控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
        
        // 设置默认相机位置
        this.setCameraPreset('default');
        
        // 创建光照
        this.setupLighting();
        
        // 创建棋盘
        this.createBoard();
        
        // 初始化射线检测
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 开始渲染循环
        this.animate();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /**
     * 设置光照
     */
    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // 主光源
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        
        // 补充光源
        const pointLight = new THREE.PointLight(0xffffff, 0.3, 100);
        pointLight.position.set(-10, 10, -5);
        this.scene.add(pointLight);
    }

    /**
     * 创建棋盘
     */
    createBoard() {
        this.boardGroup = new THREE.Group();
        this.piecesGroup = new THREE.Group();
        this.intersectionPoints = [];
        
        // 创建棋盘底座
        const boardGeometry = new THREE.BoxGeometry(14, 0.5, 14);
        const boardMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xdeb887,
            transparent: true,
            opacity: 0.9
        });
        const boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
        boardMesh.receiveShadow = true;
        boardMesh.position.y = -0.25;
        this.boardGroup.add(boardMesh);
        
        // 创建网格线 - 使用圆柱体确保在所有设备上清晰可见
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // 更深的棕色
        const lineGeometry = new THREE.CylinderGeometry(0.008, 0.008, 14, 8); // 细圆柱体
        
        // 垂直线
        for (let i = 0; i < this.boardSize; i++) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(i - 7, 0.005, 0);
            line.rotation.x = Math.PI / 2; // 旋转成水平
            this.boardGroup.add(line);
        }
        
        // 水平线  
        for (let i = 0; i < this.boardSize; i++) {
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(0, 0.005, i - 7);
            line.rotation.z = Math.PI / 2; // 旋转成垂直
            this.boardGroup.add(line);
        }
        
        // 天元点已移除 - 保持简洁的棋盘外观
        
        // 创建交叉点（用于点击检测）
        const intersectionGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const intersectionMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x3498db, 
            transparent: true, 
            opacity: 0,
            visible: false  // 确保完全不可见
        });
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const intersection = new THREE.Mesh(intersectionGeometry, intersectionMaterial);
                intersection.position.set(col - 7, 0.1, row - 7);
                intersection.userData = { row, col };
                this.intersectionPoints.push(intersection);
                this.boardGroup.add(intersection);
            }
        }
        
        this.scene.add(this.boardGroup);
        this.scene.add(this.piecesGroup);
        
        // 创建材质
        this.createMaterials();
    }

    /**
     * 创建棋子材质
     */
    createMaterials() {
        // 黑子材质
        this.materials.black = new THREE.MeshPhongMaterial({
            color: 0x1a1a1a,
            shininess: 100,
            specular: 0x333333
        });
        
        // 白子材质  
        this.materials.white = new THREE.MeshPhongMaterial({
            color: 0xf5f5f5,
            shininess: 100,
            specular: 0xffffff
        });
        
        // 提示材质
        this.materials.hint = new THREE.MeshLambertMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.7
        });
        
        // AI高亮材质
        this.materials.aiHighlight = new THREE.MeshLambertMaterial({
            color: 0x3498db,
            transparent: true,
            opacity: 0.8
        });
        
        // 棋子几何体
        this.geometries.piece = new THREE.SphereGeometry(0.3, 16, 12);
        this.geometries.pieceFlat = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 鼠标事件
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // 按钮事件
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetGameBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('getHintBtn').addEventListener('click', () => this.getHint());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        
        // 弹窗事件
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newGameFromModal').addEventListener('click', () => {
            this.closeModal();
            this.newGame();
        });
        
        // 设置变更事件
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            const difficulty = parseInt(e.target.value);
            this.ai = new GomokuAI(difficulty);
            this.showToast(`难度已调整为: ${this.getDifficultyText(difficulty)}`, 1500);
        });

        document.getElementById('speedSelect').addEventListener('change', (e) => {
            const speed = parseInt(e.target.value);
            this.showToast(`AI速度已调整为: ${this.getSpeedText(speed)}`, 1500);
        });
        
        // 相机预设切换
        document.getElementById('cameraPreset').addEventListener('change', (e) => {
            this.setCameraPreset(e.target.value);
        });
    }

    /**
     * 获取难度文本
     */
    getDifficultyText(difficulty) {
        const difficultyMap = {1: '简单', 2: '普通', 3: '困难', 4: '专家', 5: '大师'};
        return difficultyMap[difficulty] || '困难';
    }

    /**
     * 获取速度文本
     */
    getSpeedText(speed) {
        const speedMap = {0: '极速', 1: '快速', 2: '普通', 3: '慢速', 4: '深思'};
        return speedMap[speed] || '普通';
    }

    /**
     * 设置相机预设
     */
    setCameraPreset(preset) {
        const config = this.cameraPresets[preset];
        if (config) {
            this.camera.position.set(...config.position);
            this.controls.target.set(...config.target);
            this.controls.update();
        }
    }

    /**
     * 鼠标点击事件
     */
    onMouseClick(event) {
        if (this.isProcessing || this.game.gameOver || this.game.currentPlayer !== 1) {
            if (this.isProcessing) {
                this.showToast('请等待AI思考完成', 1000);
            }
            return;
        }

        this.updateMousePosition(event);
        
        // 射线检测
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.intersectionPoints);
        
        if (intersects.length > 0) {
            const { row, col } = intersects[0].object.userData;
            
            if (this.game.isValidMove(row, col)) {
                this.makePlayerMove(row, col);
            } else {
                this.showToast('该位置已有棋子', 1500);
            }
        }
    }

    /**
     * 鼠标移动事件
     */
    onMouseMove(event) {
        this.updateMousePosition(event);
        
        // 射线检测悬停效果
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.intersectionPoints);
        
        // 重置之前的悬停状态
        if (this.hoveredIntersection) {
            this.hoveredIntersection.material.opacity = 0;
            this.hoveredIntersection.visible = false;
        }
        
        if (intersects.length > 0 && !this.isProcessing && !this.game.gameOver && this.game.currentPlayer === 1) {
            const intersection = intersects[0].object;
            const { row, col } = intersection.userData;
            
            if (this.game.isValidMove(row, col)) {
                intersection.visible = true;
                intersection.material.opacity = 0.3;
                this.hoveredIntersection = intersection;
                this.renderer.domElement.style.cursor = 'pointer';
            } else {
                this.renderer.domElement.style.cursor = 'not-allowed';
            }
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    /**
     * 更新鼠标位置
     */
    updateMousePosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /**
     * 玩家落子
     */
    async makePlayerMove(row, col) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.clearHint();
        this.clearAiHighlight();
        
        // 保存状态用于悔棋
        this.saveGameState();
        
        // 立即显示玩家棋子
        this.game.makeMove(row, col, 1);
        this.placePiece(row, col, 1);
        
        // 检查玩家是否获胜
        if (this.game.gameOver) {
            this.handleGameOver();
            this.isProcessing = false;
            return;
        }
        
        // 切换到AI回合
        this.updateStatus('AI正在思考...', true);
        
        // 添加AI思考延迟
        const speed = parseInt(document.getElementById('speedSelect').value);
        const thinkingTime = this.getAIThinkingTime(speed);
        
        setTimeout(async () => {
            await this.makeAIMove();
            this.isProcessing = false;
        }, thinkingTime);
    }

    /**
     * 获取AI思考时间
     */
    getAIThinkingTime(speed) {
        const timeMap = {0: 100, 1: 300, 2: 800, 3: 1500, 4: 2500};
        return timeMap[speed] || 800;
    }

    /**
     * AI落子
     */
    async makeAIMove() {
        const startTime = Date.now();
        
        try {
            // 获取AI最佳落子
            const aiMove = this.ai.getBestMove(this.game);
            
            if (!aiMove) {
                this.showToast('AI无法找到有效落子位置', 2000);
                this.updateStatus();
                return;
            }

            const [row, col] = aiMove;
            
            // AI落子
            this.game.makeMove(row, col, 2);
            this.placePiece(row, col, 2);
            this.highlightAiMove(row, col);
            
            // 显示AI落子信息
            const thinkingTime = (Date.now() - startTime) / 1000;
            this.showAiMoveHighlight(row, col, thinkingTime.toFixed(1));
            
            // 检查游戏是否结束
            if (this.game.gameOver) {
                this.handleGameOver();
            } else {
                this.updateStatus();
            }
            
        } catch (error) {
            console.error('AI落子失败:', error);
            this.showToast('AI思考出错，请重试', 2000);
            this.updateStatus();
        }
    }

    /**
     * 在3D场景中放置棋子
     */
    placePiece(row, col, player) {
        const material = player === 1 ? this.materials.black : this.materials.white;
        const piece = new THREE.Mesh(this.geometries.piece, material);
        
        piece.position.set(col - 7, 0.3, row - 7);
        piece.castShadow = true;
        piece.userData = { row, col, player };
        
        this.piecesGroup.add(piece);
    }

    /**
     * 高亮AI落子位置
     */
    highlightAiMove(row, col) {
        this.clearAiHighlight();
        
        const highlight = new THREE.Mesh(
            new THREE.RingGeometry(0.35, 0.45, 16),
            this.materials.aiHighlight
        );
        highlight.position.set(col - 7, 0.05, row - 7);
        highlight.rotation.x = -Math.PI / 2;
        highlight.userData.isAiHighlight = true;
        
        this.lastAiMove = highlight;
        this.boardGroup.add(highlight);
        
        // 添加呼吸效果
        const animate = () => {
            if (highlight.parent) {
                highlight.material.opacity = 0.4 + 0.4 * Math.sin(Date.now() * 0.005);
                setTimeout(animate, 50);
            }
        };
        animate();
    }

    /**
     * 清除AI高亮
     */
    clearAiHighlight() {
        if (this.lastAiMove) {
            this.boardGroup.remove(this.lastAiMove);
            this.lastAiMove = null;
        }
    }

    /**
     * 显示提示
     */
    showHint() {
        this.clearHint();
        
        if (this.hintMove) {
            const hint = new THREE.Mesh(
                new THREE.RingGeometry(0.25, 0.35, 16),
                this.materials.hint
            );
            hint.position.set(this.hintMove.col - 7, 0.05, this.hintMove.row - 7);
            hint.rotation.x = -Math.PI / 2;
            hint.userData.isHint = true;
            
            this.boardGroup.add(hint);
            
            // 添加闪烁效果
            const animate = () => {
                if (hint.parent) {
                    hint.material.opacity = 0.3 + 0.4 * Math.sin(Date.now() * 0.008);
                    setTimeout(animate, 50);
                }
            };
            animate();
        }
    }

    /**
     * 清除提示
     */
    clearHint() {
        const hintsToRemove = this.boardGroup.children.filter(child => child.userData.isHint);
        hintsToRemove.forEach(hint => this.boardGroup.remove(hint));
    }

    /**
     * 保存游戏状态（用于悔棋）
     */
    saveGameState() {
        this.moveHistory.push({
            board: this.game.board.map(row => [...row]),
            currentPlayer: this.game.currentPlayer,
            gameOver: this.game.gameOver,
            winner: this.game.winner,
            pieces: this.piecesGroup.children.map(piece => ({
                row: piece.userData.row,
                col: piece.userData.col,
                player: piece.userData.player
            }))
        });
    }

    /**
     * 悔棋功能
     */
    undoMove() {
        if (this.moveHistory.length === 0) {
            this.showToast('没有可以悔棋的步骤', 1500);
            return;
        }

        if (this.isProcessing) {
            this.showToast('AI思考中，无法悔棋', 1500);
            return;
        }

        // 恢复上一个状态
        const lastState = this.moveHistory.pop();
        this.game.board = lastState.board;
        this.game.currentPlayer = lastState.currentPlayer;
        this.game.gameOver = lastState.gameOver;
        this.game.winner = lastState.winner;
        
        // 清除所有棋子
        this.piecesGroup.clear();
        
        // 重新放置棋子
        lastState.pieces.forEach(({ row, col, player }) => {
            this.placePiece(row, col, player);
        });
        
        this.clearHint();
        this.clearAiHighlight();
        this.updateStatus();
        this.showToast('悔棋成功', 1000);
    }

    /**
     * 新游戏
     */
    newGame() {
        this.game.resetGame();
        this.moveHistory = [];
        this.hintsRemaining = 1;
        this.clearAiHighlight();
        this.clearHint();
        this.updateHintsDisplay();
        
        // 清除所有棋子
        this.piecesGroup.clear();
        
        this.updateStatus();
        this.closeModal();
        this.showToast('新游戏开始！', 1500);
    }

    /**
     * 重置游戏
     */
    resetGame() {
        this.newGame();
    }

    /**
     * 获取AI提示
     */
    async getHint() {
        if (this.hintsRemaining <= 0) {
            this.showToast('每局游戏只能使用一次提示', 2000);
            return;
        }

        if (this.game.currentPlayer !== 1 || this.game.gameOver) {
            this.showToast('当前无法使用提示', 1500);
            return;
        }

        try {
            // 使用AI算法获取最佳落子位置作为提示
            const hintMove = this.ai.getBestMove(this.game);
            
            if (!hintMove) {
                this.showToast('无法获取有效提示', 2000);
                return;
            }

            this.hintMove = { row: hintMove[0], col: hintMove[1] };
            this.hintsRemaining = 0;
            this.updateHintsDisplay();
            this.showHint();
            
            this.showToast('AI建议位置已在3D场景中标出', 2500);

        } catch (error) {
            console.error('获取提示失败:', error);
            this.showToast('获取提示失败，请重试', 2000);
        }
    }

    /**
     * 更新状态显示
     */
    updateStatus(customMessage = '', showThinking = false) {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameResultElement = document.getElementById('gameResult');
        const thinkingElement = document.getElementById('thinkingStatus');
        
        if (customMessage) {
            thinkingElement.textContent = customMessage;
            return;
        }
        
        thinkingElement.textContent = '';
        
        if (this.game.gameOver) {
            gameResultElement.textContent = this.getWinnerText();
            currentPlayerElement.textContent = '游戏结束';
        } else {
            gameResultElement.textContent = '';
            if (this.game.currentPlayer === 1) {
                currentPlayerElement.textContent = '玩家 (黑子)';
            } else {
                currentPlayerElement.textContent = 'AI (白子)';
                if (showThinking) {
                    thinkingElement.textContent = 'AI正在思考...';
                }
            }
        }
    }

    /**
     * 获取获胜者文本
     */
    getWinnerText() {
        if (this.game.winner === 1) {
            return '恭喜！玩家获胜！';
        } else if (this.game.winner === 2) {
            return 'AI获胜！再接再厉！';
        } else {
            return '平局！';
        }
    }

    /**
     * 处理游戏结束
     */
    handleGameOver() {
        this.updateStatus();
        
        setTimeout(() => {
            this.showGameOverModal();
        }, 1000);
    }

    /**
     * 显示游戏结束弹窗
     */
    showGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        const gameOverText = document.getElementById('gameOverText');
        
        gameOverText.textContent = this.getWinnerText();
        modal.style.display = 'flex';
    }

    /**
     * 关闭弹窗
     */
    closeModal() {
        document.getElementById('gameOverModal').style.display = 'none';
    }

    /**
     * 更新提示次数显示
     */
    updateHintsDisplay() {
        document.getElementById('hintsRemaining').textContent = this.hintsRemaining;
        const hintBtn = document.getElementById('getHintBtn');
        hintBtn.disabled = this.hintsRemaining <= 0 || this.game.currentPlayer !== 1 || this.game.gameOver;
    }

    /**
     * 显示AI落子高亮
     */
    showAiMoveHighlight(row, col, thinkingTime) {
        const highlight = document.getElementById('aiMoveHighlight');
        highlight.textContent = `AI落子: (${row+1}, ${col+1}) [思考${thinkingTime}秒]`;
        highlight.style.display = 'block';
        
        setTimeout(() => {
            highlight.style.display = 'none';
        }, 3000);
    }

    /**
     * 显示自定义Toast
     */
    showToast(text, duration = 2000) {
        const toast = document.getElementById('customToast');
        toast.textContent = text;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    }

    /**
     * 窗口大小变化
     */
    onWindowResize() {
        const container = document.getElementById('gameScene');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    /**
     * 动画循环
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    // 确保Three.js已加载
    if (typeof THREE !== 'undefined') {
        new StaticGomoku3D();
    } else {
        console.error('Three.js未加载，无法启动3D游戏');
        document.getElementById('gameScene').innerHTML = '<p style="text-align: center; padding: 50px;">Three.js加载失败，请检查网络连接</p>';
    }
});