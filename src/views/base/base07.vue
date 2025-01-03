<template>
  <div class="content_box">
    <div ref="canvasRef" class="canvas_box">
    </div>
    <div class="result">
      <div class="item" v-for="item in list">
        <i :style="'background: ' + item.color"></i>
        <span>{{item.result}}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, Ref, ref} from "vue";
// 导入轨道控制器
import {MapControls, OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three';
// 导入动画库
const canvasRef = ref()
const list: Ref<{color: string, result: string}[]> = ref([])

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer,
    controls: MapControls, gridHelper: THREE.GridHelper, plane: THREE.Mesh, cellSize: number

const unit = 10

type Antenna = {position: THREE.Vector3, azimuth: THREE.Vector3, downtilt: THREE.Vector3}

// 初始化 Three.js 场景
const initScene = () => {
  scene = new THREE.Scene();
}

// 创建相机
const initCamera = () => {
  camera = new THREE.PerspectiveCamera(75, canvasRef.value.clientWidth / canvasRef.value.clientHeight, 0.1, 100000);
  camera.position.set(0, 0, 500);
}

// 初始化灯光
const initLight = () => {
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3); //模拟远处类似太阳的光源
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(0, 200, 0).normalize();
  scene.add(directionalLight);

  const ambient = new THREE.AmbientLight(0xffffff, 1); //AmbientLight,影响整个场景的光源
  ambient.position.set(0, 0, 300);
  scene.add(ambient);
}

// 初始化渲染器
const initRenderer = () => {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    depth: true,
  });
  renderer.setSize(canvasRef.value.clientWidth, canvasRef.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用柔和阴影

  canvasRef.value.appendChild(renderer.domElement);
}

// 初始化轨迹球控件
const initControls = () => {
  controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;
  // 设置控制器的 up 方向为 Z 轴，使得摄像机朝向 XY 平面
  controls.object.up.set(0, 0, 1);
  // 设置控制器的目标为 XY 平面的某个点
  controls.target.set(10, 0, 200);
  controls.screenSpacePanning = false;

  controls.maxPolarAngle = Math.PI / 2;

  // // 禁止上下倾斜（锁定视角的竖直方向）
  // controls.minPolarAngle = Math.PI / 2; // 限制最小俯视角度（90度）
  // controls.maxPolarAngle = Math.PI / 2; // 限制最大俯视角度（90度）
  // controls.minAzimuthAngle = 0; //
  // controls.maxAzimuthAngle = 0; //
  controls.target = new THREE.Vector3(camera.position.x, camera.position.y, 0);

  // 限制垂直旋转范围：设置俯仰角（Polar Angle）范围，单位为弧度
  // 例如：最小俯仰角 30 度，最大俯仰角 150 度
  controls.minPolarAngle = THREE.MathUtils.degToRad(0); // 下限 30 度
  controls.maxPolarAngle = THREE.MathUtils.degToRad(180); // 上限 150 度

  // 限制水平旋转范围：设置偏航角（Azimuth Angle）范围，单位为弧度
  // 例如：仅允许水平旋转到 -90 到 90 度
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(-90); // 左侧 -90 度
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(90); // 右侧 90 度
}

// 初始化网格
const initGrid = (gridSize = 12000, center = { x: 0, y: 0 }) => {
  if (gridHelper) scene.remove(gridHelper);
  if (plane) scene.remove(plane);
  // 添加网格辅助器
  const scaleFactor = 0.01; // 定义一个比例系数
  cellSize = gridSize * scaleFactor; // 根据图纸大小动态调整单元格大小
  const divisions = Math.floor(gridSize / cellSize);
  gridHelper = new THREE.GridHelper(gridSize, divisions, 0xffffff, 0xffffff);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.material.opacity = 0.5; // 50% 透明度
  gridHelper.material.transparent = true;
  gridHelper.position.set(center.x, -center.y, 0);
  scene.add(gridHelper);

  // 初始化平面
  const geometry = new THREE.PlaneGeometry(gridSize, gridSize);
  geometry.rotateX(-Math.PI / 2);
  plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ visible: false }));
  plane.rotation.x = Math.PI / 2;
  scene.add(plane);
}

const init = () => {
  initScene();
  initCamera();
  initLight();
  initRenderer();
  initControls();
  initGrid();

  renderFn()
}

// 初始化栅格
const addBox = (position: THREE.Vector3, color: number) => {
  const cubeGeometry = new THREE.BoxGeometry(100, 100, 1)
  const cubeMaterial = new THREE.MeshBasicMaterial({color})
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
  cube.position.copy(position)
  scene.add(cube)
}

const addAntenna = (antenna: Antenna) => {
// 圆锥几何体和材质
  // 创建几何
  const height = 20 * unit;     // 高度
  const radius = height * Math.tan(THREE.MathUtils.degToRad(40 / 2));      // 半径
  const radialSegments = 32;    // 分段数
  const heightSegments = 1;
  const geometry = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments, false);
  const material = new THREE.MeshBasicMaterial({
    color: 0x0077ff,
    wireframe: false,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55 });

  const cone = new THREE.Mesh( geometry, material.clone() );
  cone.name = 'AntennaPerspective'
  cone.position.copy(antenna.position)

  // 目标向量
  const targetVector = new THREE.Vector3(0, 1, 0).normalize();  // 将圆锥体对准的方向

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(antenna.downtilt, targetVector);

  // 应用旋转
  cone.quaternion.copy(quaternion);

  cone.position.add(antenna.downtilt.clone().normalize().multiplyScalar( height / 2 )); // 设置几何体的中心位置
  scene.add( cone );

  // 方位角
  const arrowHelper = new THREE.ArrowHelper(antenna.azimuth, antenna.position, 300, 0xff0000); // 长度为 5，颜色为红色
  scene.add(arrowHelper);
  // 下倾角
  const arrowHelper2 = new THREE.ArrowHelper(antenna.downtilt, antenna.position, 300, 0xfff00); // 长度为 5，颜色为红色
  scene.add(arrowHelper2);
}


const getSignedAngle = (v1: THREE.Vector3, v2: THREE.Vector3, normal: THREE.Vector3) => {
  // 确保向量归一化
  v1 = v1.clone().normalize();
  v2 = v2.clone().normalize();
  normal = normal.clone().normalize();

  // 计算向量 在面上的投影
  const projectionOnPlane = v2.clone().sub(normal.clone().multiplyScalar(v2.dot(normal)));
  const angle = projectionOnPlane.angleTo(v1)

  // 计算叉乘用于判断方向
  const cross = new THREE.Vector3().crossVectors(v1, v2);

  // 使用叉乘与法向量点乘判断正负号
  const sign = normal.dot(cross) >= 0 ? 1 : -1;

  // 返回角度（转换为 -180 到 180 范围的角度）
  return angle * sign;
}

const calc = (antenna: Antenna, point: THREE.Vector3, color: number) => {
  addBox(point, color)
  // 从天线到栅格的向量
  const direction = new THREE.Vector3().subVectors(point, antenna.position).normalize()

  const arrowHelper = new THREE.ArrowHelper(direction, antenna.position, 300, color); // 长度为 5，颜色为红色
  scene.add(arrowHelper);

  // 天线方位角向量
  const azimuth = new THREE.Vector3().copy(antenna.azimuth).normalize()
  // 天线下倾角向量
  const downtilt = new THREE.Vector3().copy(antenna.downtilt).normalize()

  // 计算 direction 在 方位角 平面的投影
  const cosThetaH = getSignedAngle(azimuth, direction, downtilt)
  // 计算水平夹角
  const angle_h = THREE.MathUtils.radToDeg(cosThetaH) // 转换为角度

  // 垂直夹角 (完整向量之间的夹角)
  // 计算 direction 在 下倾角 平面的投影
  // 计算水平夹角
  const cosThetaV = getSignedAngle(downtilt, direction, azimuth);
  const angle_v = THREE.MathUtils.radToDeg(cosThetaV) // 转换为角度

  list.value.push({color: new THREE.Color(color).getStyle(), result: `${angle_h}, ${angle_v}`})
}

onMounted(() => {
  init()
  // 栅格
  const point1 = new THREE.Vector3(2587.141817769736, 1992.4470432023936)
  const point2 = new THREE.Vector3(3749.821310937104, 2026.2637481654403)
  const point3 = new THREE.Vector3(3290.3412890230306, 3052.0096101402014)
  const point4 = new THREE.Vector3(864.5349731445312, 1762.6688232421875, 100)

  // 天线
  const antenna1 = {
    position: new THREE.Vector3(3239.57774259658,2437.41676310772,800),
    // 方位角
    azimuth: new THREE.Vector3(0, 1, 0),
    // 下倾角
    downtilt: new THREE.Vector3(0, 0, -1)
  }
  addAntenna(antenna1)

  // 计算水平夹角, 垂直夹角
  calc(antenna1, point1, 0xfff000)
  calc(antenna1, point2, 0xff00ff)
  calc(antenna1, point3, 0x00fff0)
  calc(antenna1, point4, 0xf0f0f0)

  camera.position.set(antenna1.position.x, antenna1.position.y, 2000)
  controls.target.set(camera.position.x , camera.position.y, 0);
  controls.update();
})

let animateId: number;
onUnmounted(() => {
  cancelAnimationFrame(animateId)
  renderer?.dispose()
  renderer?.forceContextLoss()
  let gl = renderer?.domElement.getContext('webgl')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
})

const renderFn = () => {
  // 设置阻尼
  controls.update()
  camera.rotation.z = 0; // 确保相机不会旋转
  renderer.render(scene, camera)
  animateId = requestAnimationFrame(renderFn)
}
</script>
<style scoped lang="scss">
.content_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .canvas_box {
    width: 100%;
    height: 100%;
  }

  .result {
    position: absolute;
    right: 20px;
    top: 20px;

    .item {
      display: flex;
      gap: 5px;
      padding: 5px;

      i {
        display: inline-block;
        width: 20px;
        height: 20px;
      }
    }
  }
}
</style>
