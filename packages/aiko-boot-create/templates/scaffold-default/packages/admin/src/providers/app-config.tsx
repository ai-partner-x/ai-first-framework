/* eslint-disable react-refresh/only-export-components */
"use client"

import { createContext, useContext, type ReactNode } from "react"

export type AppTitleConfig = {
  icon: ReactNode
  text: string
}

const defaultTitle: AppTitleConfig = {
  icon: (
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
  ),
  text: "Admin",
}

const AppConfigContext = createContext<{ title: AppTitleConfig }>({
  title: defaultTitle,
})

export function AppConfigProvider({
  children,
  title = defaultTitle,
}: {
  children: ReactNode
  title?: AppTitleConfig
}) {
  return (
    <AppConfigContext.Provider value={{ title }}>
      {children}
    </AppConfigContext.Provider>
  )
}

export function useAppConfig() {
  return useContext(AppConfigContext)
}
