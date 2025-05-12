"use client"

import React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { KmlElement } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Navigation } from "lucide-react"

interface KmlElementDetailsProps {
  element: KmlElement
  isMobile?: boolean
}

export function KmlElementDetails({ element, isMobile = false }: KmlElementDetailsProps) {
  // Format coordinates for display
  const formatCoordinates = (coords: number[][]) => {
    if (!coords || coords.length === 0) return "No coordinates"

    if (element.type === "Point") {
      const [lng, lat, alt = 0] = coords
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}${alt ? `, ${alt.toFixed(2)}m` : ""}`
    }

    return `${coords.length} points`
  }

  // Get style preview color
  const getStylePreview = () => {
    if (element.type === "LineString") {
      return element.style?.color || "#3700ff"
    } else if (element.type === "Polygon") {
      return element.style?.fillColor || "#42eedc"
    }
    return "#ff3f19"
  }

  // Open in Google Maps
  const openInGoogleMaps = () => {
    if (element.type === "Point" && element.coordinates) {
      const [lng, lat] = element.coordinates
      const destination = `${lat},${lng}`
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
      window.open(googleMapsUrl, "_blank")
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold">{element.name || `Unnamed ${element.type}`}</h3>
        <p className="text-sm text-gray-500">{element.type}</p>

        {element.type === "Point" && (
          <Button variant="outline" size="sm" className="mt-2 w-full sm:w-auto" onClick={openInGoogleMaps}>
            <Navigation className="mr-2 h-4 w-4" />
            Navegar até aqui
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid gap-4">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900">Informações Básicas</h4>
              <Separator className="my-2" />
              <dl className="grid grid-cols-3 gap-1 text-sm">
                <dt className="col-span-1 text-gray-500">Tipo</dt>
                <dd className="col-span-2">{element.type}</dd>

                <dt className="col-span-1 text-gray-500">ID</dt>
                <dd className="col-span-2 font-mono text-xs overflow-hidden text-ellipsis">{element.id}</dd>

                {element.description && (
                  <>
                    <dt className="col-span-1 text-gray-500">Descrição</dt>
                    <dd className="col-span-2">{element.description}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Coordinates */}
            <div>
              <h4 className="text-sm font-medium text-gray-900">Coordenadas</h4>
              <Separator className="my-2" />
              <dl className="grid grid-cols-3 gap-1 text-sm">
                <dt className="col-span-1 text-gray-500">Contagem</dt>
                <dd className="col-span-2">
                  {element.type === "Point"
                    ? "1 ponto"
                    : element.type === "LineString"
                      ? `${element.coordinates?.length || 0} pontos`
                      : `${element.coordinates?.reduce((sum, ring) => sum + ring.length, 0) || 0} pontos em ${
                          element.coordinates?.length || 0
                        } anéis`}
                </dd>

                {element.type === "Point" && (
                  <>
                    <dt className="col-span-1 text-gray-500">Localização</dt>
                    <dd className="col-span-2">{formatCoordinates(element.coordinates)}</dd>
                  </>
                )}

                {element.type === "LineString" && (
                  <>
                    <dt className="col-span-1 text-gray-500">Comprimento</dt>
                    <dd className="col-span-2">
                      {element.metadata?.length ? `${element.metadata.length.toFixed(2)} km` : "Não calculado"}
                    </dd>
                  </>
                )}

                {element.type === "Polygon" && (
                  <>
                    <dt className="col-span-1 text-gray-500">Área</dt>
                    <dd className="col-span-2">
                      {element.metadata?.area ? `${element.metadata.area.toFixed(2)} km²` : "Não calculada"}
                    </dd>
                  </>
                )}
              </dl>
            </div>

            {/* Style Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900">Estilo</h4>
              <Separator className="my-2" />
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: getStylePreview() }} />
                <span className="text-sm">{getStylePreview()}</span>
              </div>
              <dl className="grid grid-cols-3 gap-1 text-sm">
                {element.type === "LineString" && (
                  <>
                    <dt className="col-span-1 text-gray-500">Cor da Linha</dt>
                    <dd className="col-span-2">{element.style?.color || "Padrão"}</dd>

                    <dt className="col-span-1 text-gray-500">Largura</dt>
                    <dd className="col-span-2">{element.style?.width || "Padrão"}</dd>

                    <dt className="col-span-1 text-gray-500">Opacidade</dt>
                    <dd className="col-span-2">{element.style?.opacity || "Padrão"}</dd>
                  </>
                )}

                {element.type === "Polygon" && (
                  <>
                    <dt className="col-span-1 text-gray-500">Cor de Preenchimento</dt>
                    <dd className="col-span-2">{element.style?.fillColor || "Padrão"}</dd>

                    <dt className="col-span-1 text-gray-500">Opacidade de Preenchimento</dt>
                    <dd className="col-span-2">{element.style?.fillOpacity || "Padrão"}</dd>

                    <dt className="col-span-1 text-gray-500">Cor do Contorno</dt>
                    <dd className="col-span-2">{element.style?.strokeColor || "Padrão"}</dd>

                    <dt className="col-span-1 text-gray-500">Largura do Contorno</dt>
                    <dd className="col-span-2">{element.style?.strokeWidth || "Padrão"}</dd>
                  </>
                )}
              </dl>
            </div>

            {/* Extended Data */}
            {element.extendedData && Object.keys(element.extendedData).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900">Dados Estendidos</h4>
                <Separator className="my-2" />
                <dl className="grid grid-cols-3 gap-1 text-sm">
                  {Object.entries(element.extendedData).map(([key, value], index) => (
                    <React.Fragment key={index}>
                      <dt className="col-span-1 text-gray-500">{key}</dt>
                      <dd className="col-span-2">{value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
