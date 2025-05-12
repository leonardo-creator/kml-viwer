"use client"

import { useState } from "react"
import { Search, Map, LineChart, Hexagon, Circle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import type { KmlElement } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface KmlElementsListProps {
  elements: KmlElement[]
  selectedElement: KmlElement | null
  onElementSelect: (element: KmlElement) => void
  isMobile?: boolean
}

export function KmlElementsList({
  elements,
  selectedElement,
  onElementSelect,
  isMobile = false,
}: KmlElementsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const filteredElements = elements.filter(
    (element) =>
      (typeFilter === null || element.type === typeFilter) &&
      (element.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        element.type.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const getElementIcon = (type: string) => {
    switch (type) {
      case "Point":
        return <Circle className="h-4 w-4 text-[#ff3f19]" />
      case "LineString":
        return <LineChart className="h-4 w-4 text-[#3700ff]" />
      case "Polygon":
        return <Hexagon className="h-4 w-4 text-[#42eedc]" />
      default:
        return <Map className="h-4 w-4 text-gray-400" />
    }
  }

  // Count elements by type
  const elementCounts = elements.reduce(
    (acc, element) => {
      acc[element.type] = (acc[element.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar elementos..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={typeFilter === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setTypeFilter(null)}
          >
            Todos ({elements.length})
          </Badge>
          {Object.entries(elementCounts).map(([type, count]) => (
            <Badge
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              className={`cursor-pointer ${
                type === "Point"
                  ? "hover:bg-[#ff3f19]/90"
                  : type === "LineString"
                    ? "hover:bg-[#3700ff]/90"
                    : "hover:bg-[#42eedc]/90 hover:text-black"
              } ${
                typeFilter === type
                  ? type === "Point"
                    ? "bg-[#ff3f19]"
                    : type === "LineString"
                      ? "bg-[#3700ff]"
                      : "bg-[#42eedc] text-black"
                  : ""
              }`}
              onClick={() => setTypeFilter(type)}
            >
              {type} ({count})
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredElements.length > 0 ? (
            <div className="grid gap-1">
              {filteredElements.map((element) => (
                <button
                  key={element.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                    selectedElement?.id === element.id ? "bg-[#3700ff] text-white" : "hover:bg-gray-100"
                  }`}
                  onClick={() => onElementSelect(element)}
                >
                  {selectedElement?.id === element.id ? (
                    <div className="text-white">{getElementIcon(element.type)}</div>
                  ) : (
                    getElementIcon(element.type)
                  )}
                  <div className="flex-1 truncate">
                    <div className="font-medium">{element.name || `Unnamed ${element.type}`}</div>
                    <div
                      className={`text-xs ${selectedElement?.id === element.id ? "text-white/70" : "text-gray-500"}`}
                    >
                      {element.type}
                      {element.type === "LineString" && element.metadata?.length
                        ? ` • ${element.metadata.length.toFixed(2)} km`
                        : ""}
                      {element.type === "Polygon" && element.metadata?.area
                        ? ` • ${element.metadata.area.toFixed(2)} km²`
                        : ""}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center p-4">
              <Map className="h-8 w-8 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum elemento encontrado</h3>
              <p className="mt-1 text-xs text-gray-500">Tente ajustar sua busca ou filtros</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="text-xs text-gray-500">
          {filteredElements.length} de {elements.length} elementos
        </div>
      </div>
    </div>
  )
}
