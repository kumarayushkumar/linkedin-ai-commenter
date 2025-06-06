import { useState } from "react"
import "./styles/global.css"

function IndexSidePanel() {
  const [activeTab, setActiveTab] = useState<"comment" | "settings">("comment")

  return (
    <div className="flex flex-col h-screen bg-white ">
      <div className="flex border-b border-secondary">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "comment"
              ? "border-b-2 border-primary"
              : "hover:bg-secondary"
          }`}
          onClick={() => setActiveTab("comment")}
        >
          Comment
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === "settings"
              ? "border-b-2 border-primary"
              : "hover:bg-secondary"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      <div className="flex-1 p-4">
        {activeTab === "comment" && (
          <div className="comment-tab">
            Comment
          </div>
        )}

        {activeTab === "settings" && (
          <div className="settings-tab">
            Setting
          </div>
        )}
      </div>
    </div>
  )
}

export default IndexSidePanel