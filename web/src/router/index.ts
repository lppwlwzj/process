import type { RouteRecordRaw } from "vue-router"
import { createRouter } from "vue-router"
import { routerConfig } from "@/router/config"
import { registerNavigationGuard } from "@/router/guard"
import { flatMultiLevelRoutes } from "./helper"

const Layouts = () => import("@/layouts/index.vue")

/**
 * @name 常驻路由
 * @description 除了 redirect/403/404/login 等隐藏页面，其他页面建议设置唯一的 Name 属性
 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layouts,
    meta: {
      hidden: true
    },
    children: [
      {
        path: ":path(.*)",
        component: () => import("@/pages/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/pages/error/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/pages/error/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    path: "/login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/",
    component: Layouts,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/pages/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "首页",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/user",
    component: Layouts,
    redirect: "/user/index",
    name: "User",
    meta: {
      title: "用户管理",
      elIcon: "User"
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/user/index.vue"),
        name: "UserManagement",
        meta: {
          title: "用户列表",
           elIcon: "User"
        }
      }
    ]
  },
  {
    path: "/customer",
    component: Layouts,
    redirect: "/customer/index",
    name: "Customer",
    meta: {
      title: "客户管理",
      elIcon: "User"
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/customer/index.vue"),
        name: "CustomerManagement",
        meta: {
          title: "客户列表",
          elIcon: "User"
        }
      }
    ]
  },
  {
    path: "/process",
    component: Layouts,
    redirect: "/process/index",
    name: "Process",
    meta: {
      title: "依口进度管理",
      elIcon: "User"
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/process/index.vue"),
        name: "ProcessManagement",
        meta: {
          title: "依口进度列表",
          elIcon: "User"
        }
      }
    ]
  },
  {
    path: "/factory-process",
    component: Layouts,
    redirect: "/factory-process/index",
    name: "FactoryProcess",
    meta: {
      title: "工厂进度管理",
      elIcon: "User"
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/factory-process/index.vue"),
        name: "FactoryProcessManagement",
        meta: {
          title: "工厂进度列表",
          elIcon: "User"
        }
      }
    ]
  },
  {
    path: "/schedule",
    component: Layouts,
    redirect: "/schedule/index",
    name: "Schedule",
    meta: {
      title: "排班管理",
      elIcon: "Calendar"
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/schedule/index.vue"),
        name: "ScheduleManagement",
        meta: {
          title: "排班列表",
          elIcon: "Calendar"
        }
      }
    ]
  },
  {
    path: "/survey",
    component: Layouts,
    redirect: "/survey/index",
    name: "Survey",
    meta: {
      title: "问卷调查",
      elIcon: "Document"
    },
    children: [
      {
        path: "index",
        component: () => import("@/pages/survey/index.vue"),
        name: "SurveyList",
        meta: {
          title: "问卷结果列表",
          elIcon: "Document"
        }
      }
    ]
  },
  // {
  //   path: "/demo",
  //   component: Layouts,
  //   redirect: "/demo/unocss",
  //   name: "Demo",
  //   meta: {
  //     title: "示例集合",
  //     elIcon: "DataBoard"
  //   },
  //   children: [
  //     {
  //       path: "unocss",
  //       component: () => import("@/pages/demo/unocss/index.vue"),
  //       name: "UnoCSS",
  //       meta: {
  //         title: "UnoCSS"
  //       }
  //     },
  //     {
  //       path: "element-plus",
  //       component: () => import("@/pages/demo/element-plus/index.vue"),
  //       name: "ElementPlus",
  //       meta: {
  //         title: "Element Plus",
  //         keepAlive: true
  //       }
  //     },
  //     {
  //       path: "vxe-table",
  //       component: () => import("@/pages/demo/vxe-table/index.vue"),
  //       name: "VxeTable",
  //       meta: {
  //         title: "Vxe Table",
  //         keepAlive: true
  //       }
  //     },
  //     {
  //       path: "level2",
  //       component: () => import("@/pages/demo/level2/index.vue"),
  //       redirect: "/demo/level2/level3",
  //       name: "Level2",
  //       meta: {
  //         title: "二级路由",
  //         alwaysShow: true
  //       },
  //       children: [
  //         {
  //           path: "level3",
  //           component: () => import("@/pages/demo/level2/level3/index.vue"),
  //           name: "Level3",
  //           meta: {
  //             title: "三级路由",
  //             keepAlive: true
  //           }
  //         }
  //       ]
  //     },
  //     {
  //       path: "composable-demo",
  //       redirect: "/demo/composable-demo/use-fetch-select",
  //       name: "ComposableDemo",
  //       meta: {
  //         title: "组合式函数"
  //       },
  //       children: [
  //         {
  //           path: "use-fetch-select",
  //           component: () => import("@/pages/demo/composable-demo/use-fetch-select.vue"),
  //           name: "UseFetchSelect",
  //           meta: {
  //             title: "useFetchSelect"
  //           }
  //         },
  //         {
  //           path: "use-fullscreen-loading",
  //           component: () => import("@/pages/demo/composable-demo/use-fullscreen-loading.vue"),
  //           name: "UseFullscreenLoading",
  //           meta: {
  //             title: "useFullscreenLoading"
  //           }
  //         },
  //         {
  //           path: "use-watermark",
  //           component: () => import("@/pages/demo/composable-demo/use-watermark.vue"),
  //           name: "UseWatermark",
  //           meta: {
  //             title: "useWatermark"
  //           }
  //         }
  //       ]
  //     }
  //   ]
  // },
  
]

/**
 * @name 动态路由
 * @description 用来放置有权限 (Roles 属性) 的路由
 * @description 必须带有唯一的 Name 属性
 */
// export const dynamicRoutes: RouteRecordRaw[] = [
//   {
//     path: "/permission",
//     component: Layouts,
//     redirect: "/permission/page-level",
//     name: "Permission",
//     meta: {
//       title: "权限演示",
//       elIcon: "Lock",
//       // 可以在根路由中设置角色
//       roles: ["admin", "editor"],
//       alwaysShow: true
//     },
//     children: [
//       {
//         path: "page-level",
//         component: () => import("@/pages/demo/permission/page-level.vue"),
//         name: "PermissionPageLevel",
//         meta: {
//           title: "页面级",
//           // 或者在子路由中设置角色
//           roles: ["admin"]
//         }
//       },
//       {
//         path: "button-level",
//         component: () => import("@/pages/demo/permission/button-level.vue"),
//         name: "PermissionButtonLevel",
//         meta: {
//           title: "按钮级",
//           // 如果未设置角色，则表示：该页面不需要权限，但会继承根路由的角色
//           roles: undefined
//         }
//       }
//     ]
//   }
// ]

export const dynamicRoutes: RouteRecordRaw[] = []

/** 路由实例 */
export const router = createRouter({
  history: routerConfig.history,
  routes: routerConfig.thirdLevelRouteCache ? flatMultiLevelRoutes(constantRoutes) : constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  try {
    // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    location.reload()
  }
}

// 注册路由导航守卫
registerNavigationGuard(router)
