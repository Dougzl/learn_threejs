<template>
  <div class="content_box">
    <div class="canvas_box">
      <canvas ref="canvas" id="canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
// 导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as THREE from 'three';

const canvas = ref()

// three.js 基本内容
// 1. 创建场景
let scene: THREE.Scene | any = new THREE.Scene();

// 2. 创建相机 (透视相机)
let camera: THREE.Camera | any = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 设置相机位置
camera.position.set(0, 0, 10);
scene.add(camera)

// 添加物体
// 创建几何
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
const cubeMaterial = new THREE.MeshBasicMaterial({color: 0xffff00})

// 根据几何体和材质创建物体
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)

// 修改物体的位置
// cube.position.x = 1;
cube.position.set(1,1,0)
// 缩放
// cube.scale.set(0.3, 1.5, 1)
// 旋转
cube.rotateX(Math.PI/ 4);

// 将几何体添加到场景中
scene.add(cube)

// camera.position.x = 5;
// camera.position.y = 5;

// 添加坐标轴辅助器
const axesHelper = new THREE.AxesHelper()
scene.add(axesHelper)

let render: THREE.WebGLRenderer | any;
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
  const controls = new OrbitControls(camera, render.domElement)

  renderFn(0)
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

const renderFn = (time: number) => {
  animateId = requestAnimationFrame(renderFn)
  render.render(scene, camera)

  const t = time/ 1000 % 5;
  cube.position.x = t;
  cube.rotation.x += 0.01;

  if (cube.position.x > 5) {
    cube.position.x = 0;
  }
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

    #canvas {
      width: 100%;
      height: 100%;
    }
  }
}
</style>