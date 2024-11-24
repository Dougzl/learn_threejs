import {RouteRecordRaw} from "vue-router";

export const boxRoute: RouteRecordRaw = {
    path: '/box',
    meta: {
        label: "全面认识Three.js物体",
        lesson: "01"
    },
    redirect: {
        path: '/box/01'
    },
    children: [{
        path: "/box/01",
        name: "box01",
        component: () => import("@/views/box/box01.vue"),
        meta: {
            label: "创建矩形",
            lesson: "01",
            keys: ["bufferGeometry"],
        },
    },{
        path: "/box/02",
        name: "box02",
        component: () => import("@/views/box/box02.vue"),
        meta: {
            label: "炫酷三角形",
            lesson: "02",
            keys: ["triangle"],
        },
    },]
}