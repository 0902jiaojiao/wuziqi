// 五子棋AI网页版 - Three.js 3D版本
class Gomoku3D {
    constructor() {
        this.boardSize = 15;
        this.gameId = null;
        this.board = [];
        this.currentPlayer = 1; // 1: 玩家(黑子), 2: AI(白子)
        this.gameOver = false;
        this.winner = null;
        this.hintMove = null;
        this.hintsRemaining = 1;
        this.isProcessing = false;
        this.lastAiMove = null;
        this.serverUrl = window.location.origin;
        
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
        
        this.initializeBoard();
        this.setupEventListeners();
        this.init3DScene();
        this.createNewGame();
    }

    // 初始化棋盘数据
    initializeBoard() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
    }

    // 初始化3D场景
    init3DScene() {
        const container = document.getElementById('gameScene');
        
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f8ff);
        
        // 创建摄像机
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(8, 12, 8);
        this.camera.lookAt(0, 0, 0);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0xf0f8ff, 1);
        container.appendChild(this.renderer.domElement);
        
        // 创建控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 25;
        
        // 创建射线投射器
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 创建光源
        this.setupLighting();
        
        // 创建材质
        this.createMaterials();
        
        // 创建3D棋盘
        this.create3DBoard();
        
        // 创建棋子组
        this.piecesGroup = new THREE.Group();
        this.scene.add(this.piecesGroup);
        
        // 启动渲染循环
        this.animate();
        
        // 处理窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // 添加鼠标事件
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        this.renderer.domElement.addEventListener('click', (e) => this.onMouseClick(e), false);
        
        console.log('3D场景初始化完成');
    }

    // 设置光源
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
        directionalLight.shadow.camera.left = -15;
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;
        directionalLight.shadow.camera.bottom = -15;
        this.scene.add(directionalLight);
        
        // 补充光源
        const pointLight = new THREE.PointLight(0xffffff, 0.3, 30);
        pointLight.position.set(-5, 8, -5);
        this.scene.add(pointLight);
    }

    // 创建材质
    createMaterials() {
        // 棋盘材质
        this.materials.board = new THREE.MeshLambertMaterial({ 
            color: 0xdeb887,
            transparent: true,
            opacity: 0.9
        });
        
        // 棋盘线条材质
        this.materials.lines = new THREE.LineBasicMaterial({ 
            color: 0x8b4513,
            linewidth: 2
        });
        
        // 黑子材质
        this.materials.blackPiece = new THREE.MeshPhongMaterial({ 
            color: 0x222222,
            shininess: 100,
            specular: 0x111111
        });
        
        // 白子材质
        this.materials.whitePiece = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            shininess: 100,
            specular: 0xffffff
        });
        
        // 提示材质
        this.materials.hint = new THREE.MeshBasicMaterial({ 
            color: 0xff4444,
            transparent: true,
            opacity: 0.7
        });
        
        // AI高亮材质
        this.materials.aiHighlight = new THREE.MeshBasicMaterial({ 
            color: 0x3498db,
            transparent: true,
            opacity: 0.8
        });
        
        // 悬停材质
        this.materials.hover = new THREE.MeshBasicMaterial({ 
            color: 0x66cc66,
            transparent: true,
            opacity: 0.5
        });
    }

    // 创建3D棋盘
    create3DBoard() {
        this.boardGroup = new THREE.Group();
        
        // 创建棋盘底板
        const boardGeometry = new THREE.BoxGeometry(14, 0.5, 14);
        const boardMesh = new THREE.Mesh(boardGeometry, this.materials.board);
        boardMesh.receiveShadow = true;
        boardMesh.position.y = -0.25;
        this.boardGroup.add(boardMesh);
        
        // 创建网格线
        this.createGridLines();
        
        // 创建交叉点
        this.createIntersectionPoints();
        
        // 创建天元点
        this.createStarPoints();
        
        this.scene.add(this.boardGroup);
    }

    // 创建网格线
    createGridLines() {
        const lineGroup = new THREE.Group();
        
        // 创建线条几何体
        for (let i = 0; i < this.boardSize; i++) {
            // 水平线
            const hPoints = [];
            hPoints.push(new THREE.Vector3(-7, 0.01, i - 7));
            hPoints.push(new THREE.Vector3(7, 0.01, i - 7));
            const hGeometry = new THREE.BufferGeometry().setFromPoints(hPoints);
            const hLine = new THREE.Line(hGeometry, this.materials.lines);
            lineGroup.add(hLine);
            
            // 垂直线
            const vPoints = [];
            vPoints.push(new THREE.Vector3(i - 7, 0.01, -7));
            vPoints.push(new THREE.Vector3(i - 7, 0.01, 7));
            const vGeometry = new THREE.BufferGeometry().setFromPoints(vPoints);
            const vLine = new THREE.Line(vGeometry, this.materials.lines);
            lineGroup.add(vLine);
        }
        
        this.boardGroup.add(lineGroup);
    }

    // 创建交叉点（用于点击检测）
    createIntersectionPoints() {
        this.intersectionPoints = [];
        const pointGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const pointMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x8b4513,
            transparent: true,
            opacity: 0.3
        });
        
        for (let row = 0; row < this.boardSize; row++) {
            this.intersectionPoints[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                const point = new THREE.Mesh(pointGeometry, pointMaterial);
                point.position.set(col - 7, 0.05, row - 7);
                point.userData = { row, col };
                point.visible = false; // 默认不可见
                this.intersectionPoints[row][col] = point;
                this.boardGroup.add(point);
            }
        }
    }

    // 创建天元点
    createStarPoints() {
        const starGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 8);
        const starMaterial = new THREE.MeshBasicMaterial({ color: 0x8b4513 });
        
        const center = Math.floor(this.boardSize / 2);
        const starPositions = [
            [center, center], // 天元
            [3, 3], [3, center], [3, this.boardSize - 4],
            [center, 3], [center, this.boardSize - 4],
            [this.boardSize - 4, 3], [this.boardSize - 4, center], [this.boardSize - 4, this.boardSize - 4]
        ];
        
        starPositions.forEach(([row, col]) => {
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.set(col - 7, 0.01, row - 7);
            this.boardGroup.add(star);
        });
    }

    // 创建3D棋子
    create3DPiece(row, col, player, animate = false) {
        const pieceGeometry = new THREE.SphereGeometry(0.35, 16, 12);
        const material = player === 1 ? this.materials.blackPiece : this.materials.whitePiece;
        const piece = new THREE.Mesh(pieceGeometry, material);
        
        piece.position.set(col - 7, animate ? 5 : 0.35, row - 7);
        piece.castShadow = true;
        piece.receiveShadow = true;
        piece.userData = { row, col, player };
        
        this.piecesGroup.add(piece);
        
        // 如果需要动画
        if (animate) {
            this.animatePieceDrop(piece);
        }
        
        return piece;
    }

    // 棋子掉落动画
    animatePieceDrop(piece) {
        const targetY = 0.35;
        const startY = piece.position.y;
        const duration = 600; // 缩短动画时间
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用平滑的缓出动画，无弹跳
            const easeOutCubic = (t) => {
                return 1 - Math.pow(1 - t, 3);
            };
            
            const easedProgress = easeOutCubic(progress);
            piece.position.y = startY - (startY - targetY) * easedProgress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                piece.position.y = targetY;
            }
        };
        
        animate();
    }

    // 为AI最新棋子添加动画
    animateLatestAiPiece() {
        if (!this.lastAiMove) return;
        
        const { row, col } = this.lastAiMove;
        
        // 找到AI最新下的棋子
        this.piecesGroup.traverse((child) => {
            if (child.userData && 
                child.userData.row === row && 
                child.userData.col === col && 
                child.userData.player === 2) {
                
                // 将棋子移到空中，然后执行掉落动画
                child.position.y = 5;
                this.animatePieceDrop(child);
            }
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        // 按钮事件
        document.getElementById('newGameBtn').addEventListener('click', () => this.createNewGame());
        document.getElementById('resetGameBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('getHintBtn').addEventListener('click', () => this.getHint());
        document.getElementById('syncBtn').addEventListener('click', () => this.syncGameState());
        
        // 弹窗事件
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('newGameFromModal').addEventListener('click', () => {
            this.closeModal();
            this.createNewGame();
        });
        
        // 设置变更事件
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            if (this.gameOver) {
                this.updateDifficulty(parseInt(e.target.value));
            } else {
                this.showToast('游戏结束后可调整难度', 2000);
            }
        });
        
        // 视角预设
        document.getElementById('cameraPreset').addEventListener('change', (e) => {
            this.setCameraPreset(e.target.value);
        });
    }

    // 鼠标移动事件
    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // 射线检测
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.intersectionPoints.flat().filter(point => point.visible)
        );
        
        // 清除之前的悬停状态
        if (this.hoveredIntersection) {
            this.hoveredIntersection.material = this.hoveredIntersection.userData.originalMaterial;
            this.hoveredIntersection = null;
        }
        
        // 设置新的悬停状态
        if (intersects.length > 0 && !this.gameOver && this.currentPlayer === 1 && !this.isProcessing) {
            const intersection = intersects[0].object;
            const { row, col } = intersection.userData;
            
            if (this.board[row][col] === 0) {
                intersection.userData.originalMaterial = intersection.material;
                intersection.material = this.materials.hover;
                this.hoveredIntersection = intersection;
                this.renderer.domElement.style.cursor = 'pointer';
            } else {
                this.renderer.domElement.style.cursor = 'default';
            }
        } else {
            this.renderer.domElement.style.cursor = 'default';
        }
    }

    // 鼠标点击事件
    onMouseClick(event) {
        if (this.isProcessing || this.gameOver || this.currentPlayer !== 1) {
            if (this.isProcessing) {
                this.showToast('请等待AI思考完成', 1000);
            }
            return;
        }
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            this.intersectionPoints.flat().filter(point => point.visible)
        );
        
        if (intersects.length > 0) {
            const intersection = intersects[0].object;
            const { row, col } = intersection.userData;
            
            if (this.board[row][col] === 0) {
                this.makeMove(row, col);
            } else {
                this.showToast('该位置已有棋子', 1500);
            }
        }
    }

    // 设置摄像机预设
    setCameraPreset(preset) {
        const positions = {
            default: { x: 8, y: 12, z: 8 },
            top: { x: 0, y: 15, z: 0 },
            side: { x: 15, y: 8, z: 0 },
            close: { x: 5, y: 8, z: 5 }
        };
        
        const pos = positions[preset];
        if (pos) {
            // 平滑移动摄像机
            this.animateCamera(pos);
        }
    }

    // 摄像机动画
    animateCamera(targetPosition) {
        const startPosition = {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };
        
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            
            this.camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
            this.camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;
            this.camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased;
            
            this.camera.lookAt(0, 0, 0);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // 渲染循环
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // 窗口大小变化处理
    onWindowResize() {
        const container = document.getElementById('gameScene');
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // 更新3D场景
    update3DBoard() {
        // 清除所有棋子
        this.piecesGroup.clear();
        
        // 重新创建所有棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    this.create3DPiece(row, col, this.board[row][col]);
                }
                
                // 显示/隐藏交叉点
                if (this.intersectionPoints[row] && this.intersectionPoints[row][col]) {
                    this.intersectionPoints[row][col].visible = this.board[row][col] === 0;
                }
            }
        }
        
        // 显示提示
        this.show3DHint();
        
        // 显示AI高亮
        this.show3DAiHighlight();
    }

    // 显示3D提示
    show3DHint() {
        // 先清除之前的提示
        this.clearHintObjects();
        
        if (this.hintMove) {
            const { row, col } = this.hintMove;
            const hintGeometry = new THREE.RingGeometry(0.2, 0.4, 16);
            const hintMesh = new THREE.Mesh(hintGeometry, this.materials.hint);
            hintMesh.position.set(col - 7, 0.02, row - 7);
            hintMesh.rotation.x = -Math.PI / 2;
            hintMesh.userData.isHint = true;
            this.boardGroup.add(hintMesh);
        }
    }

    // 显示3D AI高亮
    show3DAiHighlight() {
        // 先清除之前的高亮
        this.clearAiHighlightObjects();
        
        if (this.lastAiMove) {
            const { row, col } = this.lastAiMove;
            const highlightGeometry = new THREE.RingGeometry(0.3, 0.5, 16);
            const highlightMesh = new THREE.Mesh(highlightGeometry, this.materials.aiHighlight);
            highlightMesh.position.set(col - 7, 0.03, row - 7);
            highlightMesh.rotation.x = -Math.PI / 2;
            highlightMesh.userData.isAiHighlight = true;
            
            // 添加呼吸动画
            this.animateAiHighlight(highlightMesh);
            
            this.boardGroup.add(highlightMesh);
        }
    }

    // AI高亮呼吸动画
    animateAiHighlight(mesh) {
        const startTime = Date.now();
        
        const animate = () => {
            if (!mesh.parent) return; // 如果对象已被移除则停止动画
            
            const elapsed = (Date.now() - startTime) / 1000;
            const opacity = 0.8 + 0.3 * Math.sin(elapsed * 3);
            mesh.material.opacity = opacity;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 清除提示对象
    clearHintObjects() {
        const hintsToRemove = [];
        this.boardGroup.traverse((child) => {
            if (child.userData.isHint) {
                hintsToRemove.push(child);
            }
        });
        hintsToRemove.forEach(hint => this.boardGroup.remove(hint));
    }

    // 清除AI高亮对象
    clearAiHighlightObjects() {
        const highlightsToRemove = [];
        this.boardGroup.traverse((child) => {
            if (child.userData.isAiHighlight) {
                highlightsToRemove.push(child);
            }
        });
        highlightsToRemove.forEach(highlight => this.boardGroup.remove(highlight));
    }

    // 玩家落子
    async makeMove(row, col) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.clearHint();
        this.lastAiMove = null;
        
        // 立即创建玩家棋子
        const playerPiece = this.create3DPiece(row, col, 1, true);
        this.board[row][col] = 1;
        this.update3DBoard();
        this.updateStatus('AI正在思考...', true);

        try {
            const difficulty = parseInt(document.getElementById('difficultySelect').value);
            const speed = parseInt(document.getElementById('speedSelect').value);
            
            const response = await fetch(`${this.serverUrl}/api/make_move`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: this.gameId,
                    row: row,
                    col: col,
                    difficulty: difficulty,
                    ai_speed: speed
                }),
                timeout: 30000
            });

            const result = await response.json();

            if (!response.ok) {
                // 恢复原始状态
                this.board[row][col] = 0;
                this.piecesGroup.remove(playerPiece);
                this.update3DBoard();
                throw new Error(result.message || result.error || '网络请求失败');
            }

            // 记录AI最新落子位置
            if (result.ai_move) {
                this.lastAiMove = {
                    row: result.ai_move.row,
                    col: result.ai_move.col
                };
            }

            // 延迟更新游戏状态，让AI棋子有动画效果
            setTimeout(() => {
                this.updateGameState(result.board_state);
                
                // 为AI的最新棋子添加动画
                if (this.lastAiMove) {
                    this.animateLatestAiPiece();
                }
                
                // 检查游戏是否结束
                if (result.board_state.game_over) {
                    setTimeout(() => {
                        this.handleGameOver(result.board_state.winner);
                    }, 1000); // 等待动画完成
                } else {
                    // 显示AI落子高亮
                    if (result.ai_move) {
                        const thinkingTime = result.ai_thinking_time || 0;
                        setTimeout(() => {
                            this.showAiMoveHighlight(
                                result.ai_move.row, 
                                result.ai_move.col, 
                                thinkingTime.toFixed(1)
                            );
                        }, 300); // 相对于状态更新的时间
                    }
                }
            }, 500);

        } catch (error) {
            console.error('落子失败:', error);
            
            // 恢复原始状态
            this.board[row][col] = 0;
            this.piecesGroup.remove(playerPiece);
            this.update3DBoard();
            
            this.showToast(`落子失败：${error.message}`, 3000);
            
            // 尝试同步状态
            setTimeout(() => {
                this.syncGameState();
            }, 1000);
        } finally {
            this.isProcessing = false;
            this.updateStatus();
        }
    }

    // 更新游戏状态
    updateGameState(boardState) {
        this.board = boardState.board;
        this.currentPlayer = boardState.current_player;
        this.gameOver = boardState.game_over;
        this.winner = boardState.winner;
        
        this.update3DBoard();
        this.updateStatus();
    }

    // 创建新游戏
    async createNewGame() {
        try {
            this.updateStatus('创建新游戏...', true);
            
            const difficulty = parseInt(document.getElementById('difficultySelect').value);
            
            const response = await fetch(`${this.serverUrl}/api/new_game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    difficulty: difficulty
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '创建游戏失败');
            }

            this.gameId = result.game_id;
            this.hintsRemaining = 1;
            this.lastAiMove = null;
            this.updateHintsDisplay();
            this.updateGameState(result.board_state);
            this.closeModal();
            
            this.showToast('新游戏创建成功！', 2000);

        } catch (error) {
            console.error('创建新游戏失败:', error);
            this.showToast(`创建新游戏失败：${error.message}`, 3000);
        }
    }

    // 重置游戏
    async resetGame() {
        if (!this.gameId) {
            this.createNewGame();
            return;
        }

        try {
            this.updateStatus('重置游戏...', true);
            
            const response = await fetch(`${this.serverUrl}/api/reset_game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    game_id: this.gameId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '重置游戏失败');
            }

            this.hintsRemaining = result.hints_remaining || 1;
            this.lastAiMove = null;
            this.updateHintsDisplay();
            this.updateGameState(result.board_state);
            this.closeModal();
            
            this.showToast('游戏重置成功！', 2000);

        } catch (error) {
            console.error('重置游戏失败:', error);
            this.showToast(`重置游戏失败：${error.message}`, 3000);
        }
    }

    // 获取AI提示
    async getHint() {
        if (this.hintsRemaining <= 0) {
            this.showToast('每局游戏只能使用一次提示', 2000);
            return;
        }

        if (this.currentPlayer !== 1 || this.gameOver) {
            this.showToast('当前无法使用提示', 1500);
            return;
        }

        try {
            const response = await fetch(`${this.serverUrl}/api/ai_hint?game_id=${this.gameId}`);
            const result = await response.json();

            if (!response.ok) {
                if (result.error === 'hint_already_used') {
                    this.hintsRemaining = 0;
                    this.updateHintsDisplay();
                    this.showToast('每局游戏只能使用一次提示', 2000);
                } else {
                    throw new Error(result.message || '获取提示失败');
                }
                return;
            }

            this.hintMove = result.hint_move;
            this.hintsRemaining = result.hints_remaining || 0;
            this.updateHintsDisplay();
            this.update3DBoard();
            
            this.showToast(`AI建议位置已标出（剩余${this.hintsRemaining}次）`, 2500);

        } catch (error) {
            console.error('获取提示失败:', error);
            this.showToast(`获取提示失败：${error.message}`, 3000);
        }
    }

    // 同步游戏状态
    async syncGameState() {
        if (!this.gameId) {
            this.showToast('请先创建游戏', 1500);
            return;
        }

        try {
            this.updateStatus('同步游戏状态...', true);
            
            const response = await fetch(`${this.serverUrl}/api/get_board_state?game_id=${this.gameId}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || '同步失败');
            }

            this.updateGameState(result.board_state);
            this.showToast('游戏状态同步成功', 1500);

        } catch (error) {
            console.error('同步游戏状态失败:', error);
            this.showToast(`同步失败：${error.message}`, 3000);
        }
    }

    // 清除提示
    clearHint() {
        this.hintMove = null;
        this.update3DBoard();
    }

    // 更新提示次数显示
    updateHintsDisplay() {
        document.getElementById('hintsRemaining').textContent = this.hintsRemaining;
        const hintBtn = document.getElementById('getHintBtn');
        hintBtn.disabled = this.hintsRemaining <= 0 || this.currentPlayer !== 1 || this.gameOver;
    }

    // 显示AI落子高亮
    showAiMoveHighlight(row, col, thinkingTime) {
        const highlight = document.getElementById('aiMoveHighlight');
        highlight.textContent = `AI落子: (${row+1}, ${col+1}) [思考${thinkingTime}秒]`;
        highlight.classList.add('show');
        
        setTimeout(() => {
            highlight.classList.remove('show');
        }, 3000);
    }

    // 更新状态显示
    updateStatus(customMessage = '', showThinking = false) {
        const currentPlayerElement = document.getElementById('currentPlayer');
        const gameResultElement = document.getElementById('gameResult');
        const thinkingElement = document.getElementById('thinkingStatus');
        
        if (customMessage) {
            thinkingElement.textContent = customMessage;
            return;
        }
        
        thinkingElement.textContent = '';
        
        if (this.gameOver) {
            gameResultElement.textContent = this.getWinnerText();
            currentPlayerElement.textContent = '游戏结束';
        } else {
            gameResultElement.textContent = '';
            if (this.currentPlayer === 1) {
                currentPlayerElement.textContent = '玩家 (黑子)';
            } else {
                currentPlayerElement.textContent = 'AI (白子)';
                if (showThinking) {
                    thinkingElement.textContent = 'AI正在思考...';
                }
            }
        }
    }

    // 获取获胜者文本
    getWinnerText() {
        if (this.winner === 1) {
            return '🎉 恭喜！玩家获胜！';
        } else if (this.winner === 2) {
            return '🤖 AI获胜！再接再厉！';
        } else {
            return '🤝 平局！';
        }
    }

    // 处理游戏结束
    handleGameOver(winner) {
        this.gameOver = true;
        this.winner = winner;
        this.updateStatus();
        
        // 添加获胜棋子特效
        this.addWinnerEffect();
        
        setTimeout(() => {
            this.showGameOverModal();
        }, 1000);
    }

    // 添加获胜棋子特效
    addWinnerEffect() {
        // 这里可以添加获胜棋子的特殊效果，比如发光、弹跳等
        // 由于需要额外的逻辑来检测获胜棋子，这里先保留接口
    }

    // 显示游戏结束弹窗
    showGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        const gameOverText = document.getElementById('gameOverText');
        
        gameOverText.textContent = this.getWinnerText();
        modal.style.display = 'flex';
    }

    // 关闭弹窗
    closeModal() {
        document.getElementById('gameOverModal').style.display = 'none';
    }

    // 更新难度
    updateDifficulty(difficulty) {
        console.log('Difficulty updated to:', difficulty);
    }

    // 显示自定义Toast
    showToast(text, duration = 2000) {
        const toast = document.getElementById('customToast');
        toast.textContent = text;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('开始初始化3D五子棋游戏...');
    try {
        window.game3d = new Gomoku3D();
        console.log('3D五子棋游戏初始化成功！');
    } catch (error) {
        console.error('3D五子棋游戏初始化失败:', error);
    }
});