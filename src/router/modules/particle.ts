import {RouteRecordRaw} from "vue-router";

export const particleRoute: RouteRecordRaw = {
    path: '/particle',
    meta: {
        label: "粒子特效",
        lesson: "01"
    },
    redirect: {
        path: '/particle/01'
    },
    children: [{
        path: "/particle/01",
        name: "particle01",
        component: () => import("@/views/particle/particle01.vue"),
        meta: {
            label: "Points与材质",
            lesson: "01",
            keys: ["Points", "PointsMaterial"],
        },
    },{
        path: "/particle/02",
        name: "particle02",
        component: () => import("@/views/particle/particle02.vue"),
        meta: {
            label: "点材质属性",
            lesson: "02",
            keys: ["blending", "blending"],
        },
    },{
        path: "/particle/03",
        name: "particle03",
        component: () => import("@/views/particle/particle03.vue"),
        meta: {
            label: "顶点着色器",
            lesson: "03",
            keys: ["BufferAttribute", "vertexColors"],
        },
    },{
        path: "/particle/04",
        name: "particle04",
        component: () => import("@/views/particle/particle04.vue"),
        meta: {
            label: "雪花",
            lesson: "04",
            keys: ["BufferAttribute", "vertexColors"],
        },
    },]
}