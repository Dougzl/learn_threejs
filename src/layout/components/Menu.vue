<template>
  <div class="menu_box">
    <div class="menu_content">
      <ul class="menu_list">
        <li v-for="(item, index) in list" :key="index" @click.stop="goPage(item, index)" class="menu_item"
          :class="{ active: item.children && item.children.length || index === chooseIndex }">
          <p class="menu_label">{{ item.meta?.label }}</p>
          <div class="menu_keys">
            <span v-for="key in item.meta?.keys" :key="key">{{ key }}</span>
          </div>
          <Menu
              v-if="item.children && item.children.length"
              :list="item.children"
              class="menu_child"
              :class="{ show: index === chooseIndex }"
              @choose="choose"
              :index="index"
          />
          <span v-else class="menu_lesson"><i>{{ item.meta?.lesson }}</i></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang='ts'>
/** type **/
import { menuItem } from '@/types/menu'

/** Composition API **/
import { ref, onMounted, nextTick, defineEmits } from 'vue'

/** Components **/

/** 外部依赖 **/
import { useRouter } from 'vue-router'

/** API **/

/** 属性 **/
const props = defineProps<{
  list: menuItem[],
  index: number
}>()

const emit = defineEmits(['choose'])
/** data **/
const router = useRouter()
let chooseIndex = ref(0)

/** 生命周期 **/
onMounted((): void => {
  if (localStorage.getItem('chooseIndex')) {
    chooseIndex.value = Number(localStorage.getItem('chooseIndex'))
    // 下一次页面更新时重置路由
    if (props.list[chooseIndex.value]) {
      nextTick(() => {
        router.push({
          path: props.list[chooseIndex.value].path
        })
      })
    }
  }
})

/** 方法 **/
const goPage = (menu: menuItem, index: number): void => {
  chooseIndex.value = index
  localStorage.setItem('chooseIndex', index + '')
  emit('choose', props.index)
  router.push({
    path: menu.path
  })
}

const choose = (index: number) => {
  chooseIndex.value = index
}
</script>

<style lang='scss' scoped>
.menu_box {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  user-select: none;

  .menu_content {
    width: 100%;
    height: calc(100% - 1.4rem - 1.2rem - 1px);
    box-sizing: border-box;

    .menu_list {
      width: 100%;
      height: 100%;
      padding: 0.2rem;
      overflow-y: auto;

      &::-webkit-scrollbar {
        /*滚动条整体样式*/
        width: 3px;
        display: none;
      }

      &::-webkit-scrollbar-thumb {
        /*滚动条里面小方块*/
        // border-radius: 1px;
        background-color: rgba($color: #cfe3d6, $alpha: 0.4);
      }

      &::-webkit-scrollbar-track {
        /*滚动条里面轨道*/
        // border-radius: 1px;
        background: transparent;
      }

      .menu_item {
        width: calc(100% - 0.2rem);
        height: max-content;
        margin-top: 1.2rem;
        background-color: #f3f3f3;
        border-radius: 6px;
        box-sizing: border-box;
        cursor: pointer;
        padding: 1rem;
        position: relative;

        &:hover {
          background-color: #f6f6f6;
        }

        &:first-child {
          margin-top: 0;
        }

        .menu_label {
          width: 100%;
          font-size: 1rem;
          line-height: 1em;
          color: #4d6d50;
        }

        .menu_keys {
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: flex-start;
          flex-wrap: nowrap;
          margin-top: 0.7rem;
          overflow-x: scroll;

          span {
            padding: 0.2rem 0.3rem;
            box-sizing: border-box;
            background-color: #ebefeb;
            font-size: 12px;
            text-align: center;
            line-height: 1em;
            color: #787f79;
            margin-left: 0.3rem;
            border-radius: 2px;

            &:first-child {
              margin-left: 0;
            }
          }
        }

        .menu_lesson {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          font-size: 2rem;
          color: #0000ff;
          font-weight: bold;
          opacity: 0;
        }

        .menu_child {
          overflow: hidden;
          max-height: 0;
          transition: max-height .6s;
        }

        .menu_child.show {
          max-height: 150rem;
        }
      }

      .active {
        background-color: #f9f9f9 !important;
        box-shadow: 0 0 20px rgba($color: #a2aea3, $alpha: 0.2);

        .menu_lesson {
          opacity: 0.1;
        }
      }
    }
  }
}
</style>