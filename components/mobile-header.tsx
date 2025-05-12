"use client"

import { useState } from "react"
import { Menu, X, Upload, Layers, Map, Info, FileText, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileHeaderProps {
  onTabChange: (tab: string) => void
  onUpload: () => void
  activeTab: string
  hasKmlData: boolean
  hasSelectedElement: boolean
  title?: string
}

export function MobileHeader({
  onTabChange,
  onUpload,
  activeTab,
  hasKmlData,
  hasSelectedElement,
  title = "KML Viewer",
}: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  const handleTabSelect = (tab: string) => {
    onTabChange(tab)
    setMenuOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#110043] text-white shadow-md">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center">
            {activeTab !== "map" ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleTabSelect("map")}
                className="mr-2 text-white hover:bg-white/10"
                aria-label="Back to map"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMenu}
                className="mr-2 text-white hover:bg-white/10"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
            <h1 className="text-lg font-bold truncate">
              {activeTab === "map"
                ? title
                : activeTab === "elements"
                  ? "Elementos"
                  : activeTab === "details"
                    ? "Detalhes"
                    : "Arquivo"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onUpload}
            className="text-white hover:bg-white/10"
            aria-label="Upload KML/KMZ file"
          >
            <Upload className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={toggleMenu}>
          <div className="absolute top-16 left-0 w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col p-2">
              <Button
                variant="ghost"
                className={cn(
                  "flex justify-start items-center h-12 px-4 text-left",
                  activeTab === "map" ? "bg-slate-100 text-[#3700ff]" : "text-slate-700",
                )}
                onClick={() => handleTabSelect("map")}
              >
                <Map className="mr-3 h-5 w-5" />
                <span>Mapa</span>
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "flex justify-start items-center h-12 px-4 text-left",
                  activeTab === "elements" ? "bg-slate-100 text-[#3700ff]" : "text-slate-700",
                )}
                onClick={() => handleTabSelect("elements")}
                disabled={!hasKmlData}
              >
                <Layers className="mr-3 h-5 w-5" />
                <span>Elementos</span>
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "flex justify-start items-center h-12 px-4 text-left",
                  activeTab === "details" ? "bg-slate-100 text-[#3700ff]" : "text-slate-700",
                )}
                onClick={() => handleTabSelect("details")}
                disabled={!hasSelectedElement}
              >
                <Info className="mr-3 h-5 w-5" />
                <span>Detalhes</span>
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "flex justify-start items-center h-12 px-4 text-left",
                  activeTab === "file" ? "bg-slate-100 text-[#3700ff]" : "text-slate-700",
                )}
                onClick={() => handleTabSelect("file")}
                disabled={!hasKmlData}
              >
                <FileText className="mr-3 h-5 w-5" />
                <span>Informações do Arquivo</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
