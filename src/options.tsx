import React from "react"
import { createRoot } from "react-dom/client"
import Options from "./pages/options/Options"
import "./style.css"

// 渲染选项页面
const root = document.getElementById("root")
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Options />
    </React.StrictMode>
  )
}

export default Options 