<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from 'three';

import nx from '@/assets/textures/environmentMaps/1/nx.jpg'
import ny from '@/assets/textures/environmentMaps/1/ny.jpg'
import nz from '@/assets/textures/environmentMaps/1/nz.jpg'
import px from '@/assets/textures/environmentMaps/1/px.jpg'
import py from '@/assets/textures/environmentMaps/1/py.jpg'
import pz from '@/assets/textures/environmentMaps/1/pz.jpg'

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

// 设置cube纹理加载器
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
const envTextureMap = cubeTextureLoader.load([ px, nx, py, ny, pz, nz])

// 添加球面
const geometry = new THREE.SphereGeometry( 1, 32, 32 );
const material = new THREE.MeshStandardMaterial( {
  metalness: 1,
  roughness: 0,
  envMap: envTextureMap
});
const sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );

// 灯光
const light = new THREE.AmbientLight(0xffffff, 0.5); // 环境光
scene.add(light)

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 ); // 平行光
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight)

// 添加坐标轴辅助器
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

let render: THREE.WebGLRenderer | any;
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

  // 创建轨道控制器
  controls = new OrbitControls(camera, render.domElement)
  // 设置控制器阻尼, 需在动画循环时调用 update()
  controls.enableDamping = true

  renderFn()
})

let animateId: number;
onUnmounted(() => {
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
  render.render(scene, camera)
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