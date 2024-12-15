import React from "react"
import { createRoot } from "react-dom/client"
import Options from "./Options.tsx"
import "../../style.css"

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  )
} 