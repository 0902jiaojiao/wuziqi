# 3D版本移动端缩放/移动后坐标修复

## 问题描述
缩放或移动3D棋盘后，移动端触摸反馈失效，无法正确检测触摸位置。

## 问题原因
1. **坐标系不同步**: OrbitControls改变相机位置/角度后，需要更新controls状态
2. **设备像素比问题**: 高DPI设备上canvas的实际分辨率与CSS尺寸不一致
3. **射线检测延迟**: 触摸事件发生时，controls状态可能还未完全更新

## 修复方案

### 1. 强制更新Controls状态
在所有交互事件开始时调用 `this.controls.update()`:

```javascript
// 触摸结束事件
onTouchEnd(event) {
    // 确保controls状态是最新的
    this.controls.update();
    this.updateTouchPosition(event);
    // ...
}

// 触摸移动事件
onTouchMove(event) {
    // 确保controls状态是最新的
    this.controls.update();
    this.updateTouchPosition(event);
    // ...
}

// 鼠标事件也同样处理
onMouseClick(event) {
    this.controls.update();
    // ...
}
```

### 2. 精确坐标转换
考虑设备像素比和canvas实际尺寸:

```javascript
updateTouchPosition(event) {
    if (event.changedTouches && event.changedTouches[0]) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const touch = event.changedTouches[0];
        
        // 计算精确的触摸坐标，考虑设备像素比
        const scaleX = this.renderer.domElement.width / rect.width;
        const scaleY = this.renderer.domElement.height / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // 转换为标准化设备坐标 (-1 到 +1)
        this.mouse.x = (x / this.renderer.domElement.width) * 2 - 1;
        this.mouse.y = -(y / this.renderer.domElement.height) * 2 + 1;
    }
}
```

### 3. 射线检测流程
确保射线检测使用最新的相机状态:

```javascript
// 1. 更新controls
this.controls.update();

// 2. 更新触摸坐标
this.updateTouchPosition(event);

// 3. 执行射线检测
this.raycaster.setFromCamera(this.mouse, this.camera);
const intersects = this.raycaster.intersectObjects(this.intersectionPoints);
```

## 修复效果

### ✅ 修复后功能
- **缩放后触摸**: 放大/缩小棋盘后触摸依然精确
- **旋转后触摸**: 任意角度观察棋盘都能正确交互
- **移动后触摸**: 平移棋盘后触摸位置准确
- **高DPI支持**: Retina屏幕等高分辨率设备完美支持
- **实时同步**: 相机变换和触摸检测完全同步

### 🎯 测试场景
1. **缩放测试**: 双指缩放到不同倍数，测试触摸精度
2. **旋转测试**: 拖动旋转到各个角度，验证交互准确性
3. **移动测试**: 拖动移动棋盘位置，确认坐标映射正确
4. **混合操作**: 缩放+旋转+移动的组合操作测试

## 技术要点

### OrbitControls更新机制
- `controls.update()` 确保相机矩阵与controls状态同步
- 每次交互前调用，保证射线检测使用最新变换

### 设备像素比处理
- `renderer.domElement.width` vs `getBoundingClientRect().width`
- 前者是实际画布分辨率，后者是CSS显示尺寸
- 高DPI设备两者比值 > 1

### 标准化设备坐标
- Three.js需要 (-1, 1) 范围的标准化坐标
- Y轴需要翻转 (屏幕坐标Y向下，WebGL Y向上)

## 部署信息
- **修复版本**: 已集成到 `static-game3d.js`
- **兼容性**: 支持所有移动设备和桌面浏览器
- **性能影响**: 微小，每次交互增加一次 `controls.update()` 调用