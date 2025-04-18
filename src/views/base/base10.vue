<template>
  <div class="content_box">
    <div ref="canvasRef" class="canvas_box">
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import {MapControls} from 'three/examples/jsm/controls/OrbitControls'
import {
  AmbientLight,
  BufferGeometry, DirectionalLight,
  DoubleSide,
  GridHelper, Line, Line3, LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial, MeshNormalMaterial, PCFSoftShadowMap, PerspectiveCamera, Plane,
  PlaneGeometry, Scene,
  SphereGeometry,
  Spherical, Vector3, WebGLRenderer
} from "three";
import {createPlanarGeometry} from "@/utils/tools";
import {intersect} from "@/utils/intersect";
// 导入动画库
const canvasRef = ref()

let scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer,
    controls: MapControls, gridHelper: GridHelper, plane: Mesh, cellSize: number,
    customSphere: Mesh, geometry: SphereGeometry,
    vertices: Vector3[], vertices2: Vector3[], vertices3: Vector3[]

// 初始化 js 场景
const initScene = () => {
  scene = new Scene();
}

// 创建相机
const initCamera = () => {
  camera = new PerspectiveCamera(75, canvasRef.value.clientWidth / canvasRef.value.clientHeight, 0.1, 100000);
  camera.position.set(-20, 50, 350);
}

// 初始化灯光
const initLight = () => {
  const directionalLight = new DirectionalLight(0xffffff, 0.3); //模拟远处类似太阳的光源
  directionalLight.color.setHSL(0.1, 1, 0.95);
  directionalLight.position.set(0, 200, 0).normalize();
  scene.add(directionalLight);

  const ambient = new AmbientLight(0xffffff, 1); //AmbientLight,影响整个场景的光源
  ambient.position.set(0, 0, 300);
  scene.add(ambient);
}

// 初始化渲染器
const initRenderer = () => {
  renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    depth: true,
  });
  renderer.setSize(canvasRef.value.clientWidth, canvasRef.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap; // 使用柔和阴影

  canvasRef.value.appendChild(renderer.domElement);
}

// 初始化轨迹球控件
const initControls = () => {
  controls = new MapControls(camera, renderer.domElement);
  controls.enableDamping = true;
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
  controls.target = new Vector3(camera.position.x, camera.position.y, 0);

  // 限制垂直旋转范围：设置俯仰角（Polar Angle）范围，单位为弧度
  // 例如：最小俯仰角 30 度，最大俯仰角 150 度
  controls.minPolarAngle = MathUtils.degToRad(0); // 下限 30 度
  controls.maxPolarAngle = MathUtils.degToRad(180); // 上限 150 度

  // 限制水平旋转范围：设置偏航角（Azimuth Angle）范围，单位为弧度
  // 例如：仅允许水平旋转到 -90 到 90 度
  controls.minAzimuthAngle = MathUtils.degToRad(-90); // 左侧 -90 度
  controls.maxAzimuthAngle = MathUtils.degToRad(90); // 右侧 90 度
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
  gridHelper = new GridHelper(gridSize, divisions, 0xffffff, 0xffffff);
  gridHelper.rotation.x = Math.PI / 2;
  // @ts-ignore
  gridHelper.material.opacity = 0.5; // 50% 透明度
  // @ts-ignore
  gridHelper.material.transparent = true;
  gridHelper.position.set(center.x, -center.y, 0);
  scene.add(gridHelper);

  // 初始化平面
  const geometry = new PlaneGeometry(gridSize, gridSize);
  geometry.rotateX(-Math.PI / 2);
  plane = new Mesh(geometry, new MeshBasicMaterial({ visible: false }));
  plane.rotation.x = Math.PI / 2;
  scene.add(plane);
}

const initBall = () => {

  // 1. 创建基础球体几何体
  const radius = 100; // 基础半径
  geometry = new SphereGeometry(radius, segments, segments);

  // 2. 获取顶点数据
  const positions = geometry.attributes.position.array;

  // 3. 遍历顶点，根据角度修改半径
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // 将笛卡尔坐标转换为球坐标（极角θ，方位角φ）
    const spherical = new Spherical().setFromCartesianCoords(x, y, z);
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
  const material = new MeshNormalMaterial({
    wireframe: false, // 设为 true 可查看线框结构
    side: DoubleSide
  });
  customSphere = new Mesh(geometry, material);
  customSphere.castShadow = true;
  // scene.add(customSphere);

  const materialBorder = new MeshBasicMaterial({
    color: 0x000000,
    opacity: 0.4,
    transparent: true,
    wireframe: true
  })

  const borderMesh = new Mesh(geometry, materialBorder)
  scene.add(borderMesh)
  // camera.lookAt(borderMesh.position)

  // 6. 计算与box交点的连线
  vertices && calc(vertices)
  vertices2 && calc(vertices2)
  vertices3 && calc(vertices3)
}

const initPlane = (vertices: Vector3[]) => {
  const geometry = createPlanarGeometry(vertices)
  const material = new MeshBasicMaterial({
    color: 0xdddddd,
    side: DoubleSide,
    transparent: true,
    opacity: 0.3
  })
  const plane = new Mesh(geometry, material)
  scene.add(plane)
}

const calc = (vertices: Vector3[]) => {
  const group: Vector3[][] = intersect(geometry, vertices)

  group.forEach(points => {
    const randomColor = Math.floor(Math.random() * 0xffffff);
    const material = new MeshBasicMaterial({
      color: randomColor,
      side: DoubleSide
    });
    const lineMaterial = new LineBasicMaterial({
      color: randomColor,
    });

    // 连线
    const mesh =
    // points.length > 3 ?
    //     new Mesh(createPlanarGeometry(points), material) :
        new Line(new BufferGeometry().setFromPoints(points), lineMaterial)

    scene.add(mesh);
  })
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
      new Vector3(-180, 50, -150),
      new Vector3(180, 50, 50),
      new Vector3(180, 150, 150),
      new Vector3(-180, 150, -50),
  ]
  // 垂直
  vertices2 = [
    new Vector3(-180, 0, -150),
    new Vector3(180, 0, 50),
    new Vector3(180, 0, 150),
    new Vector3(-180, 0, -50),
  ]
  // 水平
  vertices3 = [
    new Vector3(50, -150, -150),
    new Vector3(50, -150, 50),
    new Vector3(50, 150, 150),
    new Vector3(50, 150, -50),
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
