"use client"

import { useEffect, useRef, useState } from "react"
import { MapIcon, Loader2, Navigation, Locate } from "lucide-react"
import type { KmlData, KmlElement } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"

interface KmlViewerProps {
  kmlData: KmlData | null
  isLoading: boolean
  selectedElement: KmlElement | null
  onElementSelect: (element: KmlElement) => void
  isMobile?: boolean
}

export function KmlViewer({ kmlData, isLoading, selectedElement, onElementSelect, isMobile = false }: KmlViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const userMarkerRef = useRef<any>(null)
  const { toast } = useToast()

  // Initialize map when component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && !mapRef.current) {
      const initializeMap = async () => {
        try {
          // Dynamically import Leaflet
          const L = (await import("leaflet")).default

          // Import Leaflet CSS
          await import("leaflet/dist/leaflet.css")

          // Create map instance
          if (mapContainerRef.current) {
            const map = L.map(mapContainerRef.current, {
              zoomControl: !isMobile, // Hide zoom controls on mobile
              attributionControl: !isMobile, // Hide attribution on mobile
              tap: true, // Enable tap for mobile
              tapTolerance: 15, // Increase tap tolerance for mobile
              touchZoom: true, // Enable touch zoom
              dragging: true, // Enable dragging
            }).setView([0, 0], 2)

            // Add tile layer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
              minZoom: 2,
            }).addTo(map)

            // Add zoom control to bottom right if mobile
            if (isMobile) {
              L.control
                .zoom({
                  position: "bottomright",
                })
                .addTo(map)
            }

            mapRef.current = {
              instance: map,
              L: L,
              layers: new Map(),
              bounds: null,
            }

            setMapLoaded(true)
          }
        } catch (error) {
          console.error("Error initializing map:", error)
          toast({
            title: "Erro ao inicializar mapa",
            description: "Não foi possível carregar o mapa. Tente novamente mais tarde.",
            variant: "destructive",
          })
        }
      }

      initializeMap()
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current?.instance) {
        mapRef.current.instance.remove()
        mapRef.current = null
      }
    }
  }, [isMobile, toast])

  // Invalidate map size when component updates or when mobile state changes
  useEffect(() => {
    if (mapLoaded && mapRef.current?.instance) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        mapRef.current.instance.invalidateSize()
      }, 100)
    }
  }, [mapLoaded, isMobile])

  // Add resize event listener to handle orientation changes
  useEffect(() => {
    if (mapLoaded && mapRef.current?.instance) {
      const handleResize = () => {
        if (mapRef.current?.instance) {
          mapRef.current.instance.invalidateSize()
        }
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [mapLoaded])

  // Get user location
  const getUserLocation = () => {
    if (!mapLoaded || !mapRef.current) return

    setIsLocating(true)

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])

          // Center map on user location
          mapRef.current.instance.setView([latitude, longitude], 14)

          toast({
            title: "Localização encontrada",
            description: "Sua localização atual foi encontrada com sucesso.",
          })

          setIsLocating(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização. Verifique as permissões do navegador.",
            variant: "destructive",
          })
          setIsLocating(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      )
    } else {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive",
      })
      setIsLocating(false)
    }
  }

  // Update user location marker
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !userLocation) return

    const { instance: map, L } = mapRef.current

    // Remove existing user marker
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
    }

    // Create user location marker with custom icon
    const userIcon = L.divIcon({
      html: `<div class="relative">
              <div class="absolute w-6 h-6 bg-[#3700ff] rounded-full border-2 border-white animate-pulse"></div>
              <div class="absolute w-12 h-12 bg-[#3700ff] rounded-full opacity-30 animate-ping"></div>
            </div>`,
      className: "user-location-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    // Add new marker
    userMarkerRef.current = L.marker(userLocation, {
      icon: userIcon,
      zIndexOffset: 1000, // Ensure it's above other markers
    })
      .addTo(map)
      .bindTooltip("Sua localização atual", { permanent: false, direction: "top" })
  }, [mapLoaded, userLocation])

  // Render KML data on map when data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const { instance: map, L, layers } = mapRef.current

    // Clear existing layers
    layers.forEach((layer: any) => {
      map.removeLayer(layer)
    })
    layers.clear()

    // If no KML data, just return
    if (!kmlData || !kmlData.elements || kmlData.elements.length === 0) {
      console.log("No KML data to render")
      return
    }

    console.log(`Rendering ${kmlData.elements.length} KML elements on map`)

    // Create bounds object to fit map to data
    const bounds = L.latLngBounds([])
    let hasValidBounds = false

    // Render KML elements
    kmlData.elements.forEach((element) => {
      let layer

      try {
        switch (element.type) {
          case "Point":
            if (element.coordinates && element.coordinates.length >= 2) {
              const [lng, lat] = element.coordinates
              layer = L.marker([lat, lng], {
                title: element.name || "Point",
              })

              bounds.extend([lat, lng])
              hasValidBounds = true
            }
            break

          case "LineString":
            if (element.coordinates && element.coordinates.length >= 2) {
              const points = element.coordinates.map(([lng, lat]) => [lat, lng])
              layer = L.polyline(points, {
                color: element.style?.color || "#3700ff",
                weight: element.style?.width || 3,
                opacity: element.style?.opacity || 1,
              })

              points.forEach((point) => {
                bounds.extend(point)
                hasValidBounds = true
              })
            }
            break

          case "Polygon":
            if (element.coordinates && element.coordinates.length > 0) {
              const rings = element.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]))

              layer = L.polygon(rings, {
                color: element.style?.strokeColor || "#3700ff",
                weight: element.style?.strokeWidth || 1,
                opacity: element.style?.strokeOpacity || 1,
                fillColor: element.style?.fillColor || "#42eedc",
                fillOpacity: element.style?.fillOpacity || 0.2,
              })

              rings[0].forEach((point) => {
                bounds.extend(point)
                hasValidBounds = true
              })
            }
            break

          default:
            console.warn(`Unsupported KML element type: ${element.type}`)
        }
      } catch (error) {
        console.error(`Error rendering element ${element.id}:`, error)
      }

      if (layer) {
        try {
          // Create custom popup content with navigation option
          const popupContent = document.createElement("div")
          popupContent.className = "kml-popup" // Add class for styling

          // Add title if available
          if (element.name) {
            const title = document.createElement("h3")
            title.className = "font-medium mb-1 text-base"
            title.textContent = element.name
            popupContent.appendChild(title)
          }

          // Add description if available
          if (element.description) {
            const desc = document.createElement("p")
            desc.className = "text-sm mb-2"
            desc.textContent = element.description
            popupContent.appendChild(desc)
          }

          // Add navigation button
          if (element.type === "Point") {
            const navButton = document.createElement("button")
            navButton.className =
              "flex items-center gap-1 text-sm bg-[#3700ff] hover:bg-[#3700ff]/90 text-white px-3 py-2 rounded-md mt-1 w-full justify-center"
            navButton.innerHTML =
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg> Navegar até aqui'

            navButton.onclick = (e) => {
              e.stopPropagation()

              const [lng, lat] = element.coordinates
              const destination = `${lat},${lng}`
              let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`

              // If we have user's location, use it as origin
              if (userLocation) {
                const [userLat, userLng] = userLocation
                googleMapsUrl += `&origin=${userLat},${userLng}`
              }

              // Open in new tab
              window.open(googleMapsUrl, "_blank")
            }

            popupContent.appendChild(navButton)
          }

          // Add details button
          const detailsButton = document.createElement("button")
          detailsButton.className =
            "flex items-center gap-1 text-sm bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-2 rounded-md mt-2 w-full justify-center"
          detailsButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> Ver detalhes'

          detailsButton.onclick = (e) => {
            e.stopPropagation()
            onElementSelect(element)
            map.closePopup()
          }

          popupContent.appendChild(detailsButton)

          // Add popup with custom content
          const popupOptions = {
            maxWidth: isMobile ? 280 : 300,
            className: "kml-popup-container",
          }

          layer.bindPopup(popupContent, popupOptions)

          // Add click handler to select element
          layer.on("click", () => {
            onElementSelect(element)
          })

          // Add layer to map
          layer.addTo(map)

          // Store layer reference
          layers.set(element.id, layer)
        } catch (error) {
          console.error(`Error adding layer for element ${element.id}:`, error)
        }
      }
    })

    // Fit map to bounds if we have valid coordinates
    if (hasValidBounds) {
      try {
        map.fitBounds(bounds, { padding: [50, 50] })
      } catch (error) {
        console.error("Error fitting map to bounds:", error)
      }
    }

    // Store bounds for later use
    mapRef.current.bounds = hasValidBounds ? bounds : null

    // Re-add user location marker if it exists
    if (userMarkerRef.current && userLocation) {
      userMarkerRef.current.addTo(map)
    }
  }, [kmlData, mapLoaded, onElementSelect, isMobile])

  // Highlight selected element
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const { layers } = mapRef.current

    // Reset all layers to default style
    layers.forEach((layer: any) => {
      if (layer.setStyle) {
        layer.setStyle({
          weight: 3,
          color: "#3700ff",
          opacity: 1,
          fillOpacity: 0.2,
        })
      }
    })

    // Highlight selected element
    if (selectedElement) {
      const layer = layers.get(selectedElement.id)
      if (layer) {
        if (layer.setStyle) {
          layer.setStyle({
            weight: 5,
            color: "#ff3f19",
            opacity: 1,
            fillOpacity: 0.4,
          })
        }

        // Open popup
        layer.openPopup()
      }
    }
  }, [selectedElement, mapLoaded])

  // Reset view button handler
  const handleResetView = () => {
    if (!mapRef.current || !mapRef.current.instance) return

    const { instance: map, bounds } = mapRef.current

    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      map.setView([0, 0], 2)
    }
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#3700ff]" />
            <p className="mt-2 text-sm font-medium">Carregando dados KML...</p>
          </div>
        </div>
      )}

      {!kmlData && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md p-6">
            <MapIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700">Nenhum dado KML carregado</h2>
            <p className="mt-2 text-gray-500">
              Faça upload de um arquivo KML ou KMZ usando o botão no canto superior direito para visualizar dados
              geográficos neste mapa.
            </p>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="h-full w-full" />

      {mapLoaded && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={getUserLocation}
                  disabled={isLocating}
                  className="bg-white shadow-md hover:bg-gray-100 h-12 w-12 rounded-full"
                >
                  {isLocating ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#3700ff]" />
                  ) : (
                    <Locate className="h-5 w-5 text-[#3700ff]" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Encontrar minha localização</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {kmlData && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleResetView}
                    className="bg-white shadow-md hover:bg-gray-100 h-12 w-12 rounded-full"
                  >
                    <Navigation className="h-5 w-5 text-[#3700ff]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resetar visualização</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Add custom styles for Leaflet popups */}
      <style jsx global>{`
        .kml-popup-container {
          margin-bottom: 10px;
        }
        .leaflet-popup-content {
          margin: 12px;
          min-width: 200px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
        }
        .leaflet-container a.leaflet-popup-close-button {
          top: 8px;
          right: 8px;
          padding: 6px;
          color: #666;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #333;
          background-color: #f0f0f0;
          border-radius: 50%;
        }
      `}</style>
    </div>
  )
}
