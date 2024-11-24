import {RouteRecordRaw} from "vue-router";

export const materialRoute: RouteRecordRaw = {
    path: '/material',
    meta: {
        label: "详解材质与纹理",
        lesson: "01"
    },
    redirect: {
        path: '/material/01'
    },
    children: [{
        path: "/material/01",
        name: "material01",
        component: () => import("@/views/material/material01.vue"),
        meta: {
            label: "纹理材质",
            lesson: "01",
            keys: ["textureLoader"],
        },
    },{
        path: "/material/02",
        name: "material02",
        component: () => import("@/views/material/material02.vue"),
        meta: {
            label: "纹理常用属性",
            lesson: "02",
            keys: ["offset", "repeat", "rotation", "wrap"],
        },
    },{
        path: "/material/03",
        name: "material03",
        component: () => import("@/views/material/material03.vue"),
        meta: {
            label: "纹理显示算法",
            lesson: "03",
            keys: ["minFilter", "magFilter"],
        },
    },{
        path: "/material/04",
        name: "material04",
        component: () => import("@/views/material/material04.vue"),
        meta: {
            label: "透明纹理",
            lesson: "04",
            keys: ["alphaMap", "transparent", "side"],
        },
    },{
        path: "/material/05",
        name: "material05",
        component: () => import("@/views/material/material05.vue"),
        meta: {
            label: "环境遮挡",
            lesson: "05",
            keys: ["aoMap"],
        },
    },{
        path: "/material/06",
        name: "material06",
        component: () => import("@/views/material/material06.vue"),
        meta: {
            label: "PBR物理渲染,光照物理效果",
            lesson: "06",
            keys: ["MeshStandardMaterial", "AmbientLight", "DirectionalLight"],
        },
    },{
        path: "/material/07",
        name: "material07",
        component: () => import("@/views/material/material07.vue"),
        meta: {
            label: "置换贴图与顶点细分",
            lesson: "07",
            keys: ["displacementMap", "displacementScale"],
        },
    },{
        path: "/material/08",
        name: "material08",
        component: () => import("@/views/material/material08.vue"),
        meta: {
            label: "粗糙度设置与粗糙度贴图",
            lesson: "08",
            keys: ["roughnessMap", "roughness"],
        },
    },{
        path: "/material/09",
        name: "material09",
        component: () => import("@/views/material/material09.vue"),
        meta: {
            label: "金属度设置与金属度贴图",
            lesson: "09",
            keys: ["metalnessMap", "metalness"],
        },
    },{
        path: "/material/10",
        name: "material10",
        component: () => import("@/views/material/material10.vue"),
        meta: {
            label: "法线贴图",
            lesson: "10",
            keys: ["normalMap", "normalMapType", "normalScale"],
        },
    },{
        path: "/material/11",
        name: "material11",
        component: () => import("@/views/material/material11.vue"),
        meta: {
            label: "纹理加载进度",
            lesson: "11",
            keys: ["LoadingManager"],
        },
    },{
        path: "/material/12",
        name: "material12",
        component: () => import("@/views/material/material12.vue"),
        meta: {
            label: "环境贴图",
            lesson: "12",
            keys: ["envMap"],
        },
    },{
        path: "/material/13",
        name: "material13",
        component: () => import("@/views/material/material13.vue"),
        meta: {
            label: "经纬线映射贴图与HDR",
            lesson: "13",
            keys: ["CubeTextureLoader", "RGBELoader"],
        },
    },{
        path: "/material/14",
        name: "material14",
        component: () => import("@/views/material/material14.vue"),
        meta: {
            label: "清除物体，纹理保证性能及内存不泄露",
            lesson: "14",
            keys: ["remove", "dispose"],
        },
    },]
}