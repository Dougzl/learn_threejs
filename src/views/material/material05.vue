<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from 'three';

import color from '@/assets/textures/door/color.jpg'
import alpha from '@/assets/textures/door/alpha.jpg'
import ambientOcclusion from '@/assets/textures/door/ambientOcclusion.jpg'

const canvas = ref()

// three.js 基本内容
// 1. 创建场景
let scene: THREE.Scene | any = new THREE.Scene();

// 2. 创建相机（透视相机）
let camera: THREE.Camera | any = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 设置相机位置
camera.position.set(5, 5, 5);
scene.add(camera)

// 导入纹理
const textureLoader = new THREE.TextureLoader()
const doorTexture = textureLoader.load(color);
const doorAlphaTexture = textureLoader.load(alpha)
const doorAOTexture = textureLoader.load(ambientOcclusion)

// 添加物体
const cubeGeometry = new THREE.BoxGeometry(1,1,1)
// 材质
const basicMaterial = new THREE.MeshBasicMaterial({
  color: '#ff0',
  map: doorTexture,
  alphaMap: doorAlphaTexture,
  aoMap: doorAOTexture,
  aoMapIntensity: 0.7, // 阴影强度
  transparent: true,
  opacity: 1.0,
  side: THREE.DoubleSide, // 渲染两面
})
const cube = new THREE.Mesh(cubeGeometry, basicMaterial)
scene.add(cube)
// 设置第二组UV
cubeGeometry.setAttribute('uv2', new THREE.BufferAttribute(cubeGeometry.attributes.uv.array, 2))

// 添加平面
const planeGeometry = new THREE.PlaneGeometry(1, 1);
const plane = new THREE.Mesh(
    planeGeometry,
    basicMaterial
)

plane.position.set(3, 0, 0)
scene.add(plane)
//给平面设置第二组UV
planeGeometry.setAttribute('uv2', new THREE.BufferAttribute(planeGeometry.attributes.uv.array, 2))

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

    #canvas {
      width: 100%;
      height: 100%;
    }
  }
}
</style>