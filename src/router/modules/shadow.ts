import {RouteRecordRaw} from "vue-router";

export const shadowRoute: RouteRecordRaw = {
    path: '/shadow',
    meta: {
        label: "灯光与阴影",
        lesson: "01"
    },
    redirect: {
        path: '/shadow/01'
    },
    children: [{
        path: "/shadow/01",
        name: "shadow01",
        component: () => import("@/views/shadow/shadow01.vue"),
        meta: {
            label: "灯光与阴影设置",
            lesson: "01",
            keys: ["shadowMap", "castShadow", "receiveShadow"],
        },
    },{
        path: "/shadow/02",
        name: "shadow02",
        component: () => import("@/views/shadow/shadow02.vue"),
        meta: {
            label: "阴影质量与阴影相机原理",
            lesson: "02",
            keys: ["shadow.camera", "shadow.camera"],
        },
    },{
        path: "/shadow/03",
        name: "shadow03",
        component: () => import("@/views/shadow/shadow03.vue"),
        meta: {
            label: "聚光灯",
            lesson: "03",
            keys: ["spotLight"],
        },
    },{
        path: "/shadow/04",
        name: "shadow04",
        component: () => import("@/views/shadow/shadow04.vue"),
        meta: {
            label: "点光源",
            lesson: "04",
            keys: ["pointLight"],
        },
    },]
}