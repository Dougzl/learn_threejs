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
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// 导入轨道控制器
import {MapControls, OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three';
// 导入动画库
const canvasRef = ref()

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer,
    controls: MapControls, gridHelper: THREE.GridHelper, plane: THREE.Mesh, cellSize: number,
    object: THREE.Mesh, ground: THREE.Mesh, customSphere: THREE.Mesh, material: THREE.MeshPhongMaterial,
    globalPlane: THREE.Plane, localPlane: THREE.Plane

const Empty = Object.freeze( [] );

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

  // ***** Clipping setup (renderer): *****
  // @ts-ignore
  renderer.clippingPlanes = Empty; // GUI sets it to globalPlanes
  renderer.localClippingEnabled = true;
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
  const segments = 64; // 分段数（越高越平滑）
  const geometry = new THREE.SphereGeometry(radius, segments, segments);

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
/*  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff88,
    shininess: 100,
    wireframe: false // 设为 true 可查看线框结构
  });*/
  customSphere = new THREE.Mesh(geometry, material);
  customSphere.castShadow = true;
  scene.add(customSphere);
}

const initClipping = () => {
  // ***** Clipping planes: *****

  localPlane = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0.8 );
  globalPlane = new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0.1 );

  // Geometry

  material = new THREE.MeshPhongMaterial( {
    color: 0xfff00,
    shininess: 100,
    side: THREE.DoubleSide,
    // ***** Clipping setup (material): *****
    // clippingPlanes: [ localPlane, /*globalPlane*/ ],
    clipShadows: true,
    wireframe: true,
    alphaToCoverage: true,

  } );

  const geometry = new THREE.TorusKnotGeometry( 140, 20, 95, 20 );

  object = new THREE.Mesh( geometry, material );
  object.castShadow = true;
  // scene.add( object );

  ground = new THREE.Mesh(
      new THREE.PlaneGeometry( 900, 900, 1, 1 ),
      new THREE.MeshPhongMaterial( { color: 0xa0adaf, /*side: THREE.DoubleSide,*/ shininess: 0 } )
  );

  ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
  ground.receiveShadow = true;
  scene.add( ground );

}

const initGui = () => {
  // GUI
  const globalPlanes = [ globalPlane ];

  const gui = new GUI(),
      props = {
        alphaToCoverage: true,
      },
      folderLocal = gui.addFolder( 'Local Clipping' ),
      propsLocal = {

        get 'Enabled'() {

          return renderer.localClippingEnabled;

        },
        set 'Enabled'( v ) {

          renderer.localClippingEnabled = v;

        },

        get 'Shadows'() {

          return material.clipShadows;

        },
        set 'Shadows'( v ) {

          material.clipShadows = v;

        },

        get 'Plane'() {

          return localPlane.constant;

        },
        set 'Plane'( v ) {

          localPlane.constant = v;

        }

      },
      folderGlobal = gui.addFolder( 'Global Clipping' ),
      propsGlobal = {

        get 'Enabled'() {

          return renderer.clippingPlanes !== Empty;

        },
        set 'Enabled'( v ) {

          renderer.clippingPlanes = v ? globalPlanes : Empty;

        },

        get 'Plane'() {

          return globalPlane.constant;

        },
        set 'Plane'( v ) {

          globalPlane.constant = v;

        }

      };

  gui.add( props, 'alphaToCoverage' ).onChange( function ( value ) {

    ground.material.alphaToCoverage = value;
    ground.material.needsUpdate = true;

    material.alphaToCoverage = value;
    material.needsUpdate = true;

  } );
  folderLocal.add( propsLocal, 'Enabled' );
  folderLocal.add( propsLocal, 'Shadows' );
  folderLocal.add( propsLocal, 'Plane', 3, 125 );

  folderGlobal.add( propsGlobal, 'Enabled' );
  folderGlobal.add( propsGlobal, 'Plane', - 0.4, 3 );
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

  initClipping()
  initBall()
  initGui()


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
