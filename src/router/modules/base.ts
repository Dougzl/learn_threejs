import {RouteRecordRaw} from "vue-router";

export const baseRoute: RouteRecordRaw = {
    path: '/base',
    meta: {
        label: "Three.js开发入门与调试设置",
        lesson: "01"
    },
    redirect: {
        path: '/base/01'
    },
    children: [{
        path: "/base/01",
        name: "base01",
        component: () => import("@/views/base/base01.vue"),
        meta: {
            label: "基本内容",
            lesson: "01",
            keys: ["base"],
        },
    },{
        path: "/base/02",
        name: "base02",
        component: () => import("@/views/base/base02.vue"),
        meta: {
            label: "轨道控制器",
            lesson: "02",
            keys: ["OrbitControls"],
        },
    },{
        path: "/base/03",
        name: "base03",
        component: () => import("@/views/base/base03.vue"),
        meta: {
            label: "动画",
            lesson: "03",
            keys: ["requestAnimationFrame"],
        },
    },{
        path: "/base/04",
        name: "base04",
        component: () => import("@/views/base/base04.vue"),
        meta: {
            label: "动画库",
            lesson: "04",
            keys: ["gsap"],
        },
    },{
        path: "/base/05",
        name: "base05",
        component: () => import("@/views/base/base05.vue"),
        meta: {
            label: "全屏",
            lesson: "05",
            keys: ["fullscreen"],
        },
    },{
        path: "/base/06",
        name: "base06",
        component: () => import("@/views/base/base06.vue"),
        meta: {
            label: "控制面板",
            lesson: "06",
            keys: ["dat.gui"],
        },
    },{
        path: "/base/07",
        name: "base07",
        component: () => import("@/views/base/base07.vue"),
        meta: {
            label: "向量",
            lesson: "07",
            keys: ["Vector"],
        },
    },{
        path: "/base/08",
        name: "base08",
        component: () => import("@/views/base/base08.vue"),
        meta: {
            label: "剪切",
            lesson: "08",
            keys: ["clipping"],
        },
    },{
        path: "/base/09",
        name: "base09",
        component: () => import("@/views/base/base09.vue"),
        meta: {
            label: "相交",
            lesson: "09",
            keys: ["intersect"],
        },
    },]
}
