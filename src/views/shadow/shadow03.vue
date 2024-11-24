<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from 'three';

import * as dat from 'dat.gui'

// 灯光与阴影
// 1. 材质要满足能够对光照有反应
// 2. 设置渲染器开启阴影的计算 render.shadowMap.enabled = true
// 3. 设置光照投影阴影 directionalLight.castShadow = true
// 4. 设置物体投影阴影 sphere.castShadow = true
// 5. 设置物体接收阴影 plane.receiveShadow = true

const canvas = ref()

// three.js 基本内容
// 1. 创建场景
let scene: THREE.Scene | any = new THREE.Scene();

// 2. 创建相机（透视相机）
let camera: THREE.Camera | any = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 设置相机位置
camera.position.set(5, 5, 5);
scene.add(camera)

// 加载进度
const progress = ref('')

// 设置加载管理器
const loadingManager = new THREE.LoadingManager();
loadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {
  console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

};
loadingManager.onLoad = function ( ) {
  console.log( 'Loading complete!');
};

loadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
  progress.value = `${(itemsLoaded/ itemsLoaded  * 100).toFixed(2)}%`
  console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

loadingManager.onError = function ( url ) {
  console.log( 'There was an error loading ' + url );
};

// 添加球面
const sphereGeometry = new THREE.SphereGeometry( 1, 32, 32 );
const sphereMaterial = new THREE.MeshStandardMaterial( {
  // metalness: 1,
  // roughness: 0,
  // envMap: envTextureMap
});
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add( sphere );
sphere.position.set(0, 1, 0)
// 设置物体投影阴影
sphere.castShadow = true

// 添加平面
const planeGeometry = new THREE.PlaneGeometry(20, 20)
const planeMaterial = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide
})
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(plane)
plane.rotateX(Math.PI / 2)
// 设置接收阴影
plane.receiveShadow = true

// 灯光
const light = new THREE.AmbientLight(0xffffff, 0.5); // 环境光
scene.add(light)

const spotLight = new THREE.SpotLight( 0xffffff, 0.6 ); // 聚光灯
spotLight.position.set(5, 5, 5);
spotLight.castShadow = true
scene.add(spotLight)

// 设置阴影贴图模糊度
spotLight.shadow.radius = 20;
// 设置阴影贴图的分辨率
spotLight.shadow.mapSize.set(9216, 9216)
spotLight.target = sphere // 设置聚光灯目标
spotLight.angle = Math.PI / 6
spotLight.distance = 0
spotLight.penumbra = 0 // 聚光灯 半影衰减
spotLight.decay  = 2 // 需要设置物理渲染器
spotLight.intensity = 2 // 亮度调节

const gui = new dat.GUI()
gui.add(spotLight.position, 'x')
    .min(-5)
    .max(5)
    .step(0.1)
gui.add(spotLight, 'angle')
    .min(0)
    .max(Math.PI/2)
    .step(0.01)
gui.add(spotLight, 'distance')
    .min(0)
    .max(10)
    .step(0.1)
gui.add(spotLight, 'penumbra')
    .min(0)
    .max(1)
    .step(0.01)
gui.add(spotLight, 'decay')
    .min(0)
    .max(5)
    .step(1)

// 添加坐标轴辅助器
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

let render: THREE.WebGLRenderer | null;

let controls: OrbitControls;
onMounted(() => {
  // 初始化渲染器
  render = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true // 抗锯齿
  });
  render.setSize(window.innerWidth, window.innerHeight)
  // // 使用渲染器，通过相机将场景渲染进来
  // render.render(scene, camera)
  // 开启shadow
  render.shadowMap.enabled = true
  // 开启物理渲染器
  render.physicallyCorrectLights = true

  // 创建轨道控制器
  controls = new OrbitControls(camera, render.domElement)
  // 设置控制器阻尼, 需在动画循环时调用 update()
  controls.enableDamping = true

  renderFn()
})

let animateId: number;
onUnmounted(() => {
  gui.destroy()
  cancelAnimationFrame(animateId)
  render?.dispose()
  render?.forceContextLoss()
  let gl = render?.domElement.getContext('webgl')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  render = null
  scene = null
  camera = null
})

const renderFn = () => {
  // 设置阻尼
  controls.update()
  render?.render(scene, camera)
  animateId = requestAnimationFrame(renderFn)
}
</script>

<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvas"></canvas>
      <div class="progress_box">加载进度：{{ progress }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.content_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .canvas_box {
    width: 100%;
    height: 100%;
    position: relative;

    #canvas {
      width: 100%;
      height: 100%;
    }

    .progress_box {
      position: absolute;
      padding: 5px 10px;
      background-color: #fff;
      color: #1a1a1a;
      bottom: 10px;
      right: 10px;
    }
  }
}
</style>