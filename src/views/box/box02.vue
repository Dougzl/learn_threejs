<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from 'three';
// 导入动画库
import gsap from "gsap";

const canvas = ref()

// three.js 基本内容
// 1. 创建场景
let scene: THREE.Scene | any = new THREE.Scene();

// 2. 创建相机（透视相机）
let camera: THREE.Camera | any = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 设置相机位置
camera.position.set(10, 10, 10);
scene.add(camera)

// 创建炫酷三角形
const meshs = Array.from({length: 50}, (_, i) => {
  // 每个三角形，需要3个顶点，每个顶点需要3个值
  const geometry = new THREE.BufferGeometry();
  const positionArr = new Float32Array(9);
  for (let j = 0; j < 9; j++) {
    positionArr[j] = Math.random() * 10 - 5
  }
  // itemSize = 3 因为每个顶点都是一个三元组。
  let color = new THREE.Color(Math.random(), Math.random(), Math.random())
  geometry.setAttribute( 'position', new THREE.BufferAttribute( positionArr, 3 ) );
  // 设置透明度
  const material = new THREE.MeshBasicMaterial( { color: color, transparent: true, opacity: Math.random() } );
  const mesh = new THREE.Mesh( geometry, material );

  scene.add(mesh)
  return mesh
})

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
  scene.remove(camera)
  scene.remove(axesHelper)
  meshs.forEach(mesh => {
    mesh.geometry.dispose()
    mesh.material.dispose()
    scene.remove(mesh)
  })
  axesHelper.dispose()
  cancelAnimationFrame(animateId)
})

const renderFn = () => {
  cancelAnimationFrame(animateId)
  render?.dispose()
  render?.forceContextLoss()
  let gl = render?.domElement.getContext('webgl')
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  render = null
  scene = null
  camera = null
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