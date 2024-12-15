import React from "react"
import { createRoot } from "react-dom/client"
import Options from "./pages/options/Options.tsx"
import { ToastContainer } from 'react-toastify'
import "./style.css"
import 'react-toastify/dist/ReactToastify.css'

// 渲染选项页面
const root = document.getElementById("root")
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <Options />
      <ToastContainer />
    </React.StrictMode>
  )
} 