// KML Element Types
export type KmlElementType = "Point" | "LineString" | "Polygon" | "MultiGeometry" | "GroundOverlay" | "NetworkLink"

// KML Style
export interface KmlStyle {
  id?: string
  color?: string
  width?: number
  opacity?: number
  fillColor?: string
  fillOpacity?: number
  strokeColor?: string
  strokeWidth?: number
  strokeOpacity?: number
  iconUrl?: string
  iconScale?: number
}

// KML Element
export interface KmlElement {
  id: string
  type: KmlElementType
  name?: string
  description?: string
  coordinates: number[][] // For Point: [lng, lat, alt?], For LineString: [[lng, lat, alt?], ...], For Polygon: [[[lng, lat, alt?], ...], ...]
  style?: KmlStyle
  extendedData?: Record<string, string>
  metadata?: {
    length?: number // For LineString: length in km
    area?: number // For Polygon: area in km²
  }
}

// KML Data
export interface KmlData {
  name?: string
  description?: string
  elements: KmlElement[]
}
