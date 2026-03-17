import React from "react"
import { createRoot } from "react-dom/client"

import "./i18n"
import App from "./App"
import { appAuth, } from "@scaffold/core"
import { createBackendAuthProvider } from "./providers/auth-provider"

const container = document.getElementById("root") as HTMLElement
const root = createRoot(container)

// set app auth config
appAuth.setup(createBackendAuthProvider(import.meta.env.VITE_API_URL)).then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
