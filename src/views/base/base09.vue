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
import earcut from "earcut";
// 导入动画库
const canvasRef = ref()

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer,
    controls: MapControls, gridHelper: THREE.GridHelper, plane: THREE.Mesh, cellSize: number,
    customSphere: THREE.Mesh, geometry: THREE.SphereGeometry,
    vertices: THREE.Vector3[], vertices2: THREE.Vector3[], vertices3: THREE.Vector3[]

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

const segments = 4; // 分段数（越高越平滑）
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
  // @ts-ignore
  gridHelper.material.opacity = 0.5; // 50% 透明度
  // @ts-ignore
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

const initBall = () => {

  // 1. 创建基础球体几何体
  const radius = 100; // 基础半径
  geometry = new THREE.SphereGeometry(radius, segments, segments);

  // 2. 获取顶点数据
  const positions = geometry.attributes.position.array;

  // 3. 遍历顶点，根据角度修改半径
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // 将笛卡尔坐标转换为球坐标（极角θ，方位角φ）
    const spherical = new THREE.Spherical().setFromCartesianCoords(x, y, z);
    const theta = spherical.theta; // 极角（垂直夹角，范围 [0, π]）
    const phi = spherical.phi;     // 方位角（水平夹角，范围 [0, 2π]）

    // 定义半径拉伸函数（示例：根据极角和方位角混合拉伸）
    const stretch = 1.5 * Math.sin(theta * 2) + 0.3 * Math.cos(phi * 2); // 自定义函数
    const newRadius = radius * (1 + stretch); // 动态调整半径

    // 更新顶点位置
    // @ts-ignore
    positions[i] *= newRadius / radius;
    // @ts-ignore
    positions[i + 1] *= newRadius / radius;
    // @ts-ignore
    positions[i + 2] *= newRadius / radius;
  }

  // 4. 更新几何体法线（关键步骤！）
  geometry.computeVertexNormals();

  // 5. 创建材质与网格
  const material = new THREE.MeshNormalMaterial({
    wireframe: false, // 设为 true 可查看线框结构
    side: THREE.DoubleSide
  });
  customSphere = new THREE.Mesh(geometry, material);
  customSphere.castShadow = true;
  // scene.add(customSphere);

  const materialBorder = new THREE.MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.4,
    transparent: true,
    wireframe: true
  })

  const borderMesh = new THREE.Mesh(geometry, materialBorder)
  scene.add(borderMesh)

  // 6. 计算与box交点的连线
  vertices && calc(vertices)
  vertices2 && calc(vertices2)
  vertices3 && calc(vertices3)
}

const index = (points: THREE.Vector3[]) => {
  // 判断是否垂直于 XY 平面
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);

  const isPerpendicularToX = new Set(xValues).size === 1;
  const isPerpendicularToY = new Set(yValues).size === 1;
  let indices;
  if (isPerpendicularToX) {
    indices = earcut(points.reduce((a: number[], b: THREE.Vector3) => [...a, b.y, b.z], []));
  } else if (isPerpendicularToY) {
    indices = earcut(points.reduce((a: number[], b: THREE.Vector3) => [...a, b.x, b.z], []));
  } else {
    indices = earcut(points.reduce((a: number[], b: THREE.Vector3) => [...a, b.x, b.y], []));
  }
  return indices
}

const generatePlan = (points: THREE.Vector3[]): THREE.BufferGeometry | any => {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
  });

  // 提取 x 和 y 坐标，忽略 z 坐标，转换为 earcut 所需的二维数组格式
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(index(points));
  return geometry;
};

const initPlane = (vertices: THREE.Vector3[]) => {
  const geometry = generatePlan(vertices)
  const material = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  })
  const plane = new THREE.Mesh(geometry, material)
  scene.add(plane)
}

// 判断点是否在四边形内
const isPointInParallelogram = (point: THREE.Vector3, vertices: THREE.Vector3[]) => {
  // 这里假设平行四边形的顶点顺序为 A, B, C, D，
  // 并且 A、B、D 分别是一个角的起点和其相邻的两个顶点
  const u = new THREE.Vector3().subVectors(vertices[1], vertices[0]);
  const v = new THREE.Vector3().subVectors(vertices[3], vertices[0]);
  const w = new THREE.Vector3().subVectors(point, vertices[0]);

  const uu = u.dot(u);
  const uv = u.dot(v);
  const vv = v.dot(v);
  const wu = w.dot(u);
  const wv = w.dot(v);

  const Ddenom = uu * vv - uv * uv;
  // 如果 Ddenom 很接近 0 则说明 u 和 v 共线，不构成平行四边形
  if (Math.abs(Ddenom) < 1e-6) return false;

  const s = (wu * vv - wv * uv) / Ddenom;
  const t = (wv * uu - wu * uv) / Ddenom;

  return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

// 计算两条线段的交点
const getLineSegmentIntersection = (p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3, tolerance = 1e-6) => {
  // 计算向量
  const r = new THREE.Vector3().subVectors(p2, p1);
  const s = new THREE.Vector3().subVectors(p4, p3);
  const w0 = new THREE.Vector3().subVectors(p1, p3);

  // 计算系数
  const a = r.dot(r);
  const b = r.dot(s);
  const c = s.dot(s);
  const d = r.dot(w0);
  const e = s.dot(w0);

  const denominator = a * c - b * b;

  // 如果 denominator 接近0，则线条平行或共线
  if (Math.abs(denominator) < tolerance) {
    return null; // 无唯一交点
  }

  // 求参数 t 和 s
  const t = (b * e - c * d) / denominator;
  const sParam = (a * e - b * d) / denominator;

  // 检查参数是否在 [0,1] 内
  if (t < 0 || t > 1 || sParam < 0 || sParam > 1) {
    return null; // 线段延长线相交，但线段本身不相交
  }

  // 计算两条直线上的对应点
  const P = p1.clone().add(r.clone().multiplyScalar(t));
  const Q = p3.clone().add(s.clone().multiplyScalar(sParam));

  // 如果两点足够接近，则认为交于该点
  if (P.distanceTo(Q) > tolerance) {
    return null; // 两条直线最近点距离较大，认为没有交点
  }

  // 返回交点
  return P;
}

// 相交
const intersectPlane = (triangle: THREE.Vector3[], vertices: THREE.Vector3[]) => {
  const plane = new THREE.Plane().setFromCoplanarPoints(vertices[0], vertices[1], vertices[2])

  const l1 = new THREE.Line3(triangle[0], triangle[1])
  const l2 = new THREE.Line3(triangle[0], triangle[2])
  const l3 = new THREE.Line3(triangle[1], triangle[2])

  const p1 = plane.intersectLine(l1, new THREE.Vector3())
  const p2 = plane.intersectLine(l2, new THREE.Vector3())
  const p3 = plane.intersectLine(l3, new THREE.Vector3())

  let line: THREE.Vector3[] = []
  p1 && line.push(p1)
  p2 && line.push(p2)
  p3 && line.push(p3)

  // const box = new THREE.Box3().setFromPoints(vertices)
  // const boxHelper = new THREE.Box3Helper(box)
  // scene.add(boxHelper)

  // 有交点
  if (line.length == 2 && line.some(l => isPointInParallelogram(l, vertices))) {
    let geometry = new THREE.BufferGeometry().setFromPoints(line);
    if (
        line.some(l => !isPointInParallelogram(l, vertices))
    ) {
      const container = line.find(l => isPointInParallelogram(l, vertices))
      for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % vertices.length]; // 下一个顶点
        const intersection = getLineSegmentIntersection(line[0], line[1], p1, p2);
        if (intersection) {
          // @ts-ignore
          geometry = new THREE.BufferGeometry().setFromPoints([container, intersection])
        }
      }
    }

    const randomColor = Math.floor(Math.random() * 0xffffff);
    const material = new THREE.LineBasicMaterial({
      color: randomColor,
    });

    // 连线
    const mesh = new THREE.Line(geometry, material);
    scene.add(mesh);
  }
}

const calc = (vertices: THREE.Vector3[]) => {
  // 获取顶点位置和索引
  const positions = geometry.attributes.position.array; // 顶点坐标数组
  const indices = geometry.index?.array || []; // 面索引数组

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];     // 第一个顶点的索引
    const b = indices[i + 1]; // 第二个顶点的索引
    const c = indices[i + 2]; // 第三个顶点的索引

    // 获取三个顶点的坐标
    const v1 = new THREE.Vector3(
        positions[a * 3],     // x
        positions[a * 3 + 1], // y
        positions[a * 3 + 2]  // z
    );
    const v2 = new THREE.Vector3(
        positions[b * 3],     // x
        positions[b * 3 + 1], // y
        positions[b * 3 + 2]  // z
    );
    const v3 = new THREE.Vector3(
        positions[c * 3],     // x
        positions[c * 3 + 1], // y
        positions[c * 3 + 2]  // z
    );
    intersectPlane([v1, v2, v3], vertices)
  }
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


onMounted(() => {
  init()

  // 倾斜
  vertices = [
      new THREE.Vector3(-180, 50, -150),
      new THREE.Vector3(180, 50, 50),
      new THREE.Vector3(180, 150, 150),
      new THREE.Vector3(-180, 150, -50),
  ]
  // 垂直
  vertices2 = [
    new THREE.Vector3(-180, 0, -150),
    new THREE.Vector3(180, 0, 50),
    new THREE.Vector3(180, 0, 150),
    new THREE.Vector3(-180, 0, -50),
  ]
  // 水平
  vertices3 = [
    new THREE.Vector3(50, -60, -150),
    new THREE.Vector3(50, -60, 50),
    new THREE.Vector3(50, 150, 150),
    new THREE.Vector3(50, 150, -50),
  ]

  vertices && initPlane(vertices)
  vertices2 && initPlane(vertices2)
  vertices3 && initPlane(vertices3)

  initBall()


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
