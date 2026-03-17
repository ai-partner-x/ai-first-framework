import React from "react"
import { createRoot } from "react-dom/client"

import "./i18n"
import App from "./App"
import { appAuth, defaultAuthProvider } from "@scaffold/core"

const container = document.getElementById("root") as HTMLElement
const root = createRoot(container)

// set app auth config
appAuth.setup(defaultAuthProvider).then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
