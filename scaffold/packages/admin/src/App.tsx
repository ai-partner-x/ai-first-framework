import { useEffect, useState } from "react"
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject,
} from "react-router"
import { useTranslation } from "react-i18next"
import { AppConfigProvider } from "./providers/app-config"

import { ThemeProvider } from "./components/admin-ui/theme/theme-provider"
import { Toaster } from "./components/admin-ui/notification/toaster"
import { MenuLayout } from "./layouts/menu-layout"
import { TileLayout } from "./layouts/tile-layout"
import { HomePage } from "./pages/home-page"
import { getModulesContext } from "./routes"
import "./App.css"
import { SignInForm } from "./components/admin-ui/form/sign-in-form"
import { appAuth } from "@scaffold/core"
import { AuthorizationProvider, setAppAuthorizationConfig } from "@scaffold/core"
import { ErrorComponent } from "./components/admin-ui/layout/error-component"
import { withSuspense } from "./routes/withSuspense"
import { LOGIN_URL } from "./app.config"

const LAYOUT_STORAGE_KEY = "admin-layout-mode"

const defaultTitleIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
)

/** 登录页：根据 auth state 同步渲染，已登录则重定向到首页 */
function LoginPageRoute() {
  const result = appAuth.check()
  if (result.isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return <SignInForm />
}

/** 根布局：负责 layoutMode 与基础布局切换（菜单 / Tile） */
function RootLayout() {
  const [layoutMode, setLayoutMode] = useState<"menu" | "tile">(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY)
    return (saved === "menu" || saved === "tile" ? saved : "tile") as "menu" | "tile"
  })

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, layoutMode)
  }, [layoutMode])

  const handleLayoutModeChange = (mode: "menu" | "tile") => {
    setLayoutMode(mode)
  }

  const LayoutWrapper =
    layoutMode === "menu" ? (
      <MenuLayout onLayoutModeChange={handleLayoutModeChange} />
    ) : (
      <TileLayout onLayoutModeChange={handleLayoutModeChange} />
    )

  return (
    <>
      {LayoutWrapper}
    </>
  )
}


function AppShell() {
  const { t } = useTranslation()
  const { routes, middlewares } = getModulesContext()
  const appRoutes: RouteObject[] = [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, middleware: [middlewares[0]], element: <HomePage /> } as RouteObject,
        ...(routes as RouteObject[]),
        { path: "*", element: <ErrorComponent /> },
      ],
    },
  ]

  // When LOGIN_URL is an internal path (e.g. "/login"), we register a local login route.
  // For external login URLs (e.g. SSO like "https://sso.example.com/login"), routing is handled outside this app.
  const isExternalLogin = LOGIN_URL.startsWith("http")

  if (!isExternalLogin) {
    appRoutes.unshift({
      path: LOGIN_URL,
      element: withSuspense(LoginPageRoute),
    })
  }

  const router = createBrowserRouter(appRoutes)
  setAppAuthorizationConfig({
    fallbackUrl: '/not-found',
  })
  return (
    <ThemeProvider>
      <AppConfigProvider
        title={{ icon: defaultTitleIcon, text: t("common.appTitle") }}
      >
        <AuthorizationProvider>
          <RouterProvider router={router} />
        </AuthorizationProvider>
        <Toaster />
      </AppConfigProvider>
    </ThemeProvider>
  )
}

export default function App() {
  return <AppShell />
}
