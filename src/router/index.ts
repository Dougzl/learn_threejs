import { createWebHashHistory, createRouter, RouteRecordRaw } from 'vue-router'
import { baseRoute } from "@/router/modules/base";
import { boxRoute } from "@/router/modules/box";
import { materialRoute } from "@/router/modules/material";
import { shadowRoute } from "@/router/modules/shadow";
import { particleRoute } from "@/router/modules/particle"
import { demoRoute } from "@/router/modules/demo";

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: {
      path: "/base/01",
    },
  },
  baseRoute,
  boxRoute,
  materialRoute,
  shadowRoute,
  particleRoute,
  demoRoute
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router