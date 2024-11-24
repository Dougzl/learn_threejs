<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from 'three';

import point1 from '@/assets/textures/particles/1.png'
import point2 from '@/assets/textures/particles/2.png'

const canvas = ref()

// three.js 基本内容
// 1. 创建场景
let scene: THREE.Scene | any = new THREE.Scene();

// 2. 创建相机（透视相机）
let camera: THREE.Camera | any = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 设置相机位置
camera.position.set(5, 5, 5);
scene.add(camera)

//
const particlesGeometry = new THREE.BufferGeometry();
const count = 5000

// 设置缓冲区数组
const positions = new Float32Array(count * 3)
// 设置顶点颜色
const colors = new Float32Array(count * 3)
for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5 ) * 100
  colors[i] = Math.random()
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

// 普通材质
// const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true})
// const sphere = new THREE.Mesh(sphereGeometry, material)

// 点材质
const material = new THREE.PointsMaterial({
  size: .5,
  // 是否随深度衰减
  sizeAttenuation: true
})

// 载入纹理
const textureLoader = new THREE.TextureLoader()
// const texture = textureLoader.load(point1);
const texture = textureLoader.load(point1);
// 设置点材质纹理
material.map = texture
// 设置透明贴图，黑色透明
material.alphaMap = texture
material.transparent = true
// 关闭深度检测
material.depthWrite = false
// 叠加算法
material.blending = THREE.AdditiveBlending
// 启用顶点颜色
material.vertexColors = true

const sphere = new THREE.Points(particlesGeometry, material)

scene.add(sphere)

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