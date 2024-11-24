<template>
  <div class="layout">
    <div class="left_part">
      <div class="head_title">
        <p>The Example of ThreeJs</p>
      </div>
      <div class="left_menu">
        <Menu :list="listData" :index="0" />
      </div>
    </div>
    <div class="right_part">
      <Content/>
    </div>
  </div>
</template>

<script setup lang='ts'>
/** type **/
import { menuItem } from '@/types/menu'
import { RouteRecordRaw } from "vue-router";

/** Composition API **/
import { ref, onMounted } from 'vue'

/** Components **/
import Menu from './components/Menu.vue'
import Content from './components/Content.vue'

/** 外部依赖 **/
import { routes } from '@/router'

/** API **/

/** 属性 **/

/** data **/
let listData = ref<menuItem[]>([])

/** 生命周期 **/
onMounted((): void => {
  listData.value = formatRoute(routes)
})

const formatRoute = (routes:  RouteRecordRaw[] = []): menuItem[] => {
  return routes.filter(route => route.path !== '/').map((route) => {
    return {
      path: route.path,
      meta: route.meta,
      children: formatRoute(route.children || [])
    }
  });
}

/** 方法 **/

</script>

<style lang='scss' scoped>
.layout {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  .left_part {
    width: 18%;
    height: 100%;

    .head_title {
      width: 100%;
      padding: 1.2rem;
      box-sizing: border-box;
      border-bottom: 1px dashed #8d958e;
      user-select: none;

      p {
        font-size: 1.4rem;
        text-align: left;
        line-height: 1em;
        color: #4d6d50;
        font-weight: 500;
      }
    }

    .left_menu {
      padding: 1.2rem;
      background-color: #f3f3f3;
      height: calc(100% - 3.6rem);
      overflow: hidden;
    }
  }
  .right_part {
    width: 82%;
    height: 100%;
    overflow: hidden;
  }
}
</style>