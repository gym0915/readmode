import React from "react"
import { LLMConfig } from "./components/LLMConfig"
import { ProxyConfig } from "./components/ProxyConfig"

const Options: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-8">
        <LLMConfig />
        <ProxyConfig />
      </div>
    </div>
  )
}

export default Options 