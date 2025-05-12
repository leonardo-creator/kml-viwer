"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { KmlViewer } from "@/components/kml-viewer"
import { KmlElementsList } from "@/components/kml-elements-list"
import { KmlElementDetails } from "@/components/kml-element-details"
import { parseKml } from "@/lib/kml-parser"
import type { KmlData, KmlElement } from "@/lib/types"
import { FileInfoPanel } from "@/components/file-info-panel"
import { useMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"

export default function ViewerPage() {
  const [kmlData, setKmlData] = useState<KmlData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<KmlElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [fileType, setFileType] = useState<"kml" | "kmz" | null>(null)

  const { isMobile, viewportWidth } = useMobile()
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [activeTab, setActiveTab] = useState<string>("map")

  // Effect to resize map when activeTab changes
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      // Trigger resize event to force Leaflet to recalculate its size
      window.dispatchEvent(new Event("resize"))
    }, 100)

    return () => clearTimeout(timer)
  }, [activeTab, sidebarOpen])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)
    setFileName(file.name)
    setFileSize(file.size)
    setFileType(file.name.toLowerCase().endsWith(".kmz") ? "kmz" : "kml")

    try {
      const isKmz = file.name.toLowerCase().endsWith(".kmz")

      if (isKmz) {
        // Handle KMZ file
        try {
          const { parseKmz } = await import("@/lib/kmz-parser")
          const parsedData = await parseKmz(file)
          setKmlData(parsedData)
          setSelectedElement(null)
        } catch (err) {
          console.error("KMZ parsing error:", err)
          setError(err instanceof Error ? err.message : "Failed to parse KMZ file. Please check the file format.")
        }
      } else {
        // Handle KML file
        const reader = new FileReader()

        reader.onload = async (e) => {
          try {
            const kmlString = e.target?.result as string
            const parsedData = await parseKml(kmlString)
            setKmlData(parsedData)
            setSelectedElement(null)
          } catch (err) {
            console.error("KML parsing error:", err)
            setError(err instanceof Error ? err.message : "Failed to parse KML file. Please check the file format.")
          }
        }

        reader.onerror = (e) => {
          console.error("File reading error:", e)
          setError("Failed to read the file.")
        }

        reader.readAsText(file)
      }
    } catch (err) {
      console.error("File upload error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleElementSelect = (element: KmlElement) => {
    setSelectedElement(element)
    if (isMobile) {
      // On mobile, when selecting an element, show details
      handleTabChange("details")
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)

    // Small delay to ensure DOM has updated
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 100)
  }

  const handleTabChange = (tab: string) => {
    if (tab === "map") {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
      const tabsElement = document.querySelector('[role="tablist"]') as HTMLElement
      if (tabsElement) {
        const tabTrigger = tabsElement.querySelector(`[data-state][value="${tab}"]`) as HTMLElement
        if (tabTrigger) {
          tabTrigger.click()
        }
      }
    }
    setActiveTab(tab)

    // Small delay to ensure DOM has updated
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 100)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {isMobile ? (
        <MobileHeader
          onTabChange={handleTabChange}
          onUpload={() => fileInputRef.current?.click()}
          activeTab={activeTab}
          hasKmlData={!!kmlData}
          hasSelectedElement={!!selectedElement}
          title={fileName || "KML Viewer"}
        />
      ) : (
        <header className="px-4 h-16 flex items-center bg-[#110043] text-white">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2 text-white hover:bg-white/10">
                {sidebarOpen ? <X className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </Button>
              <h1 className="text-xl md:text-2xl font-bold">KML Viewer</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                className="border-white text-white hover:bg-white hover:text-[#110043]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload KML/KMZ
              </Button>
            </div>
          </div>
        </header>
      )}

      <main className={`flex flex-1 overflow-hidden ${isMobile ? "pt-16" : ""}`}>
        {/* Sidebar */}
        <div
          className={`relative flex flex-col border-r bg-white transition-all duration-300 ${
            sidebarOpen ? (isMobile ? "absolute z-20 h-full w-full md:relative md:w-80" : "w-80") : "w-0"
          }`}
        >
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className={`absolute ${
                sidebarOpen ? "right-4 top-4 z-30" : "-right-10 top-4"
              } flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md`}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
            </button>
          )}

          {sidebarOpen && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <Tabs defaultValue="elements" className="flex-1 overflow-hidden">
                <div className="border-b px-4 py-2">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="elements">Elementos</TabsTrigger>
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="file">Arquivo</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="elements" className="flex-1 overflow-hidden p-0">
                  {kmlData ? (
                    <KmlElementsList
                      elements={kmlData.elements}
                      selectedElement={selectedElement}
                      onElementSelect={handleElementSelect}
                      isMobile={isMobile}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center">
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum arquivo KML carregado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Faça upload de um arquivo KML para visualizar seus elementos
                        </p>
                        <div className="mt-6">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#3700ff] hover:bg-[#3700ff]/90"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload KML
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="flex-1 overflow-hidden p-0">
                  {selectedElement ? (
                    <KmlElementDetails element={selectedElement} isMobile={isMobile} />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center">
                      <div>
                        <Info className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum elemento selecionado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Selecione um elemento do mapa ou da lista de elementos para ver detalhes
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="file" className="flex-1 overflow-hidden p-0">
                  <FileInfoPanel
                    kmlData={kmlData}
                    fileName={fileName}
                    fileSize={fileSize}
                    fileType={fileType}
                    isMobile={isMobile}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="relative flex-1 overflow-hidden">
          {error && (
            <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-50">
              <X className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <KmlViewer
            kmlData={kmlData}
            isLoading={isLoading}
            selectedElement={selectedElement}
            onElementSelect={handleElementSelect}
            isMobile={isMobile}
          />
        </div>
      </main>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".kml,.kmz" onChange={handleFileUpload} className="hidden" />
    </div>
  )
}
