import { v4 as uuidv4 } from "uuid"
import type { KmlData, KmlElement, KmlStyle } from "./types"

// Common KML namespaces that might be missing in some files
const KML_NAMESPACES = {
  xmlns: "http://www.opengis.net/kml/2.2",
  "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  "xmlns:gx": "http://www.google.com/kml/ext/2.2",
  "xmlns:atom": "http://www.w3.org/2005/Atom",
  "xmlns:kml": "http://www.opengis.net/kml/2.2",
}

// Parse KML string to KmlData object
export async function parseKml(kmlString: string): Promise<KmlData> {
  try {
    // Check if the input is valid
    if (!kmlString || typeof kmlString !== "string") {
      throw new Error("Invalid KML content: Empty or not a string")
    }

    // Pre-process the KML content to fix common namespace issues
    const processedKmlString = preprocessKml(kmlString)

    // Parse XML
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(processedKmlString, "text/xml")

    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror")
    if (parserError) {
      console.error("XML parsing error:", parserError.textContent)

      // Try a more lenient approach - parse as HTML and extract the KML content
      console.log("Attempting fallback parsing method...")
      return fallbackParse(kmlString)
    }

    // Verify this is a KML document
    const kmlElement = xmlDoc.querySelector("kml")
    if (!kmlElement) {
      console.warn("Missing <kml> root element, attempting to continue anyway")
    }

    // Extract document info
    const kmlDoc = xmlDoc.querySelector("kml Document") || xmlDoc.querySelector("Document")
    const name = kmlDoc?.querySelector("name")?.textContent || undefined
    const description = kmlDoc?.querySelector("description")?.textContent || undefined

    // Extract styles
    const styles = parseStyles(xmlDoc)

    // Extract placemarks
    const elements = parsePlacemarks(xmlDoc, styles)

    // If no elements were found, warn but don't fail
    if (elements.length === 0) {
      console.warn("No KML elements found in the file")
    }

    return {
      name,
      description,
      elements,
    }
  } catch (error) {
    console.error("Error parsing KML:", error)
    throw error instanceof Error ? error : new Error("Failed to parse KML file")
  }
}

// Preprocess KML string to fix common namespace issues
function preprocessKml(kmlString: string): string {
  try {
    // Check if the kml root element is present
    if (!kmlString.includes("<kml")) {
      console.warn("No <kml> root element found, wrapping content")
      // Wrap the content in a kml element with proper namespaces
      return `<kml xmlns="http://www.opengis.net/kml/2.2">${kmlString}</kml>`
    }

    // Check if the kml element has the necessary namespaces
    const kmlTagMatch = kmlString.match(/<kml[^>]*>/)
    if (kmlTagMatch) {
      const kmlTag = kmlTagMatch[0]
      let updatedTag = kmlTag

      // Add missing namespaces
      Object.entries(KML_NAMESPACES).forEach(([ns, url]) => {
        if (!kmlTag.includes(ns)) {
          updatedTag = updatedTag.replace(">", ` ${ns}="${url}">`)
        }
      })

      // Replace the original kml tag with the updated one
      if (updatedTag !== kmlTag) {
        console.log("Adding missing namespaces to KML root element")
        return kmlString.replace(kmlTag, updatedTag)
      }
    }

    return kmlString
  } catch (error) {
    console.warn("Error preprocessing KML:", error)
    return kmlString // Return original string if preprocessing fails
  }
}

// Fallback parsing method for problematic KML files
async function fallbackParse(kmlString: string): Promise<KmlData> {
  console.log("Using fallback parsing method")

  // Create a basic KML data structure
  const kmlData: KmlData = {
    elements: [],
  }

  try {
    // Use regular expressions to extract placemarks
    const placemarkRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/g
    const nameRegex = /<name[^>]*>([\s\S]*?)<\/name>/
    const descRegex = /<description[^>]*>([\s\S]*?)<\/description>/
    const pointRegex = /<Point[^>]*>([\s\S]*?)<\/Point>/
    const lineRegex = /<LineString[^>]*>([\s\S]*?)<\/LineString>/
    const polygonRegex = /<Polygon[^>]*>([\s\S]*?)<\/Polygon>/
    const coordsRegex = /<coordinates[^>]*>([\s\S]*?)<\/coordinates>/

    let match
    while ((match = placemarkRegex.exec(kmlString)) !== null) {
      const placemarkContent = match[1]

      // Extract name
      const nameMatch = nameRegex.exec(placemarkContent)
      const name = nameMatch ? nameMatch[1].trim() : undefined

      // Extract description
      const descMatch = descRegex.exec(placemarkContent)
      const description = descMatch ? descMatch[1].trim() : undefined

      // Check for geometry types
      const pointMatch = pointRegex.exec(placemarkContent)
      const lineMatch = lineRegex.exec(placemarkContent)
      const polygonMatch = polygonRegex.exec(placemarkContent)

      let type: "Point" | "LineString" | "Polygon" | null = null
      let geometryContent = ""

      if (pointMatch) {
        type = "Point"
        geometryContent = pointMatch[1]
      } else if (lineMatch) {
        type = "LineString"
        geometryContent = lineMatch[1]
      } else if (polygonMatch) {
        type = "Polygon"
        geometryContent = polygonMatch[1]
      }

      if (type) {
        // Extract coordinates
        const coordsMatch = coordsRegex.exec(geometryContent)
        if (coordsMatch) {
          const coordsText = coordsMatch[1].trim()
          const coordinates = parseCoordinatesText(coordsText, type)

          if (coordinates.length > 0) {
            kmlData.elements.push({
              id: uuidv4(),
              type,
              name,
              description,
              coordinates: type === "Polygon" ? [coordinates] : coordinates,
              style: {
                color: "#3700ff",
                fillColor: "#42eedc",
                fillOpacity: 0.2,
              },
            })
          }
        }
      }
    }

    console.log(`Fallback parsing extracted ${kmlData.elements.length} elements`)
    return kmlData
  } catch (error) {
    console.error("Fallback parsing failed:", error)
    return {
      elements: [],
    }
  }
}

// Helper function for fallback parsing to parse coordinate strings
function parseCoordinatesText(coordsText: string, type: "Point" | "LineString" | "Polygon"): number[][] {
  try {
    // Clean up the coordinates string
    const cleanedString = coordsText
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/,\s+/g, ",") // Remove spaces after commas

    // Split by whitespace and filter out empty strings
    const coordStrings = cleanedString.split(/\s+/).filter(Boolean)

    return coordStrings.map((coordStr) => {
      try {
        const parts = coordStr.split(",")
        const lng = Number.parseFloat(parts[0])
        const lat = Number.parseFloat(parts[1])
        const alt = parts.length > 2 ? Number.parseFloat(parts[2]) : 0

        // Check if valid coordinates
        if (isNaN(lng) || isNaN(lat)) {
          console.warn(`Invalid coordinate: ${coordStr}`)
          return [0, 0, 0]
        }

        return [lng, lat, alt]
      } catch (error) {
        console.warn(`Error parsing coordinate: ${coordStr}`, error)
        return [0, 0, 0]
      }
    })
  } catch (error) {
    console.error("Error parsing coordinates text:", error)
    return []
  }
}

// Parse KML styles
function parseStyles(xmlDoc: Document): Map<string, KmlStyle> {
  const styles = new Map<string, KmlStyle>()

  try {
    // Process Style elements
    const styleElements = xmlDoc.querySelectorAll("Style")
    styleElements.forEach((styleEl) => {
      const id = styleEl.getAttribute("id")
      if (!id) return

      const style: KmlStyle = {}

      // Line style
      const lineStyle = styleEl.querySelector("LineStyle")
      if (lineStyle) {
        const color = lineStyle.querySelector("color")?.textContent
        const width = lineStyle.querySelector("width")?.textContent

        if (color) style.color = kmlColorToHex(color)
        if (width) style.width = Number.parseFloat(width)
      }

      // Polygon style
      const polyStyle = styleEl.querySelector("PolyStyle")
      if (polyStyle) {
        const color = polyStyle.querySelector("color")?.textContent
        const fill = polyStyle.querySelector("fill")?.textContent
        const outline = polyStyle.querySelector("outline")?.textContent

        if (color) style.fillColor = kmlColorToHex(color)
        if (fill) style.fillOpacity = fill === "1" ? 0.5 : 0
        if (outline) style.strokeOpacity = outline === "1" ? 1 : 0
      }

      // Icon style
      const iconStyle = styleEl.querySelector("IconStyle")
      if (iconStyle) {
        const scale = iconStyle.querySelector("scale")?.textContent
        const icon = iconStyle.querySelector("Icon href")?.textContent

        if (scale) style.iconScale = Number.parseFloat(scale)
        if (icon) style.iconUrl = icon
      }

      styles.set(id, style)
    })

    // Process StyleMap elements
    const styleMaps = xmlDoc.querySelectorAll("StyleMap")
    styleMaps.forEach((styleMap) => {
      const id = styleMap.getAttribute("id")
      if (!id) return

      // Get normal style reference
      const normalPair = Array.from(styleMap.querySelectorAll("Pair")).find((pair) => {
        const key = pair.querySelector("key")
        return key && key.textContent === "normal"
      })

      const styleUrl = normalPair?.querySelector("styleUrl")?.textContent

      if (styleUrl && styleUrl.startsWith("#")) {
        const referencedStyle = styles.get(styleUrl.substring(1))
        if (referencedStyle) {
          styles.set(id, referencedStyle)
        }
      }
    })
  } catch (error) {
    console.error("Error parsing styles:", error)
  }

  return styles
}

// Update the parsePlacemarks function to be more robust
function parsePlacemarks(xmlDoc: Document, styles: Map<string, KmlStyle>): KmlElement[] {
  const elements: KmlElement[] = []

  try {
    const placemarks = xmlDoc.querySelectorAll("Placemark")
    console.log(`Found ${placemarks.length} placemarks in KML`)

    placemarks.forEach((placemark, index) => {
      try {
        const name = placemark.querySelector("name")?.textContent || undefined
        const description = placemark.querySelector("description")?.textContent || undefined

        // Get style
        let style: KmlStyle | undefined
        const styleUrl = placemark.querySelector("styleUrl")?.textContent
        if (styleUrl && styleUrl.startsWith("#")) {
          style = styles.get(styleUrl.substring(1))
        }

        // Get extended data
        const extendedData: Record<string, string> = {}
        const dataElements = placemark.querySelectorAll("ExtendedData Data")
        dataElements.forEach((dataEl) => {
          const dataName = dataEl.getAttribute("name")
          const dataValue = dataEl.querySelector("value")?.textContent
          if (dataName && dataValue) {
            extendedData[dataName] = dataValue
          }
        })

        // Process geometry
        // Point
        const point = placemark.querySelector("Point")
        if (point) {
          const coordinates = parseCoordinates(point.querySelector("coordinates")?.textContent)
          if (coordinates && coordinates.length > 0) {
            elements.push({
              id: uuidv4(),
              type: "Point",
              name,
              description,
              coordinates: coordinates[0],
              style,
              extendedData: Object.keys(extendedData).length > 0 ? extendedData : undefined,
            })
          }
          return
        }

        // LineString
        const lineString = placemark.querySelector("LineString")
        if (lineString) {
          const coordinates = parseCoordinates(lineString.querySelector("coordinates")?.textContent)
          if (coordinates && coordinates.length > 0) {
            // Calculate length
            let length = 0
            for (let i = 1; i < coordinates.length; i++) {
              length += calculateDistance(
                coordinates[i - 1][1],
                coordinates[i - 1][0],
                coordinates[i][1],
                coordinates[i][0],
              )
            }

            elements.push({
              id: uuidv4(),
              type: "LineString",
              name,
              description,
              coordinates,
              style,
              extendedData: Object.keys(extendedData).length > 0 ? extendedData : undefined,
              metadata: {
                length,
              },
            })
          }
          return
        }

        // Polygon
        const polygon = placemark.querySelector("Polygon")
        if (polygon) {
          const outerBoundary = polygon.querySelector("outerBoundaryIs LinearRing coordinates")?.textContent
          const innerBoundaries = polygon.querySelectorAll("innerBoundaryIs LinearRing coordinates")

          const rings: number[][][] = []

          // Add outer boundary
          if (outerBoundary) {
            const outerCoords = parseCoordinates(outerBoundary)
            if (outerCoords && outerCoords.length > 0) {
              rings.push(outerCoords)
            }
          }

          // Add inner boundaries (holes)
          innerBoundaries.forEach((innerBoundary) => {
            const innerCoords = parseCoordinates(innerBoundary.textContent)
            if (innerCoords && innerCoords.length > 0) {
              rings.push(innerCoords)
            }
          })

          if (rings.length > 0) {
            // Calculate area (approximate)
            const area = calculatePolygonArea(rings[0])

            elements.push({
              id: uuidv4(),
              type: "Polygon",
              name,
              description,
              coordinates: rings,
              style,
              extendedData: Object.keys(extendedData).length > 0 ? extendedData : undefined,
              metadata: {
                area,
              },
            })
          }
          return
        }

        // MultiGeometry (not fully implemented)
        const multiGeometry = placemark.querySelector("MultiGeometry")
        if (multiGeometry) {
          // For simplicity, we'll just extract the first geometry in the MultiGeometry
          // A complete implementation would create multiple elements or a special MultiGeometry type

          const point = multiGeometry.querySelector("Point")
          const lineString = multiGeometry.querySelector("LineString")
          const polygon = multiGeometry.querySelector("Polygon")

          if (point) {
            const coordinates = parseCoordinates(point.querySelector("coordinates")?.textContent)
            if (coordinates && coordinates.length > 0) {
              elements.push({
                id: uuidv4(),
                type: "Point",
                name: name ? `${name} (Multi)` : undefined,
                description,
                coordinates: coordinates[0],
                style,
                extendedData: Object.keys(extendedData).length > 0 ? extendedData : undefined,
              })
            }
          } else if (lineString) {
            const coordinates = parseCoordinates(lineString.querySelector("coordinates")?.textContent)
            if (coordinates && coordinates.length > 0) {
              elements.push({
                id: uuidv4(),
                type: "LineString",
                name: name ? `${name} (Multi)` : undefined,
                description,
                coordinates,
                style,
                extendedData: Object.keys(extendedData).length > 0 ? extendedData : undefined,
              })
            }
          } else if (polygon) {
            const outerBoundary = polygon.querySelector("outerBoundaryIs LinearRing coordinates")?.textContent
            if (outerBoundary) {
              const coordinates = parseCoordinates(outerBoundary)
              if (coordinates && coordinates.length > 0) {
                elements.push({
                  id: uuidv4(),
                  type: "Polygon",
                  name: name ? `${name} (Multi)` : undefined,
                  description,
                  coordinates: [coordinates],
                  style,
                  extendedData: Object.keys(extendedData).length > 0 ? extendedData : undefined,
                })
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error parsing placemark ${index}:`, error)
        // Continue with other placemarks
      }
    })
  } catch (error) {
    console.error("Error parsing placemarks:", error)
  }

  return elements
}

// Update the parseCoordinates function to be more robust
function parseCoordinates(coordinatesString: string | null | undefined): number[][] {
  if (!coordinatesString) return []

  try {
    // Clean up the coordinates string
    const cleanedString = coordinatesString
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/,\s+/g, ",") // Remove spaces after commas

    // Split by whitespace and filter out empty strings
    const coordStrings = cleanedString.split(/\s+/).filter(Boolean)

    return coordStrings.map((coordStr) => {
      try {
        const parts = coordStr.split(",")
        const lng = Number.parseFloat(parts[0])
        const lat = Number.parseFloat(parts[1])
        const alt = parts.length > 2 ? Number.parseFloat(parts[2]) : 0

        // Check if valid coordinates
        if (isNaN(lng) || isNaN(lat)) {
          console.warn(`Invalid coordinate: ${coordStr}`)
          return [0, 0, 0]
        }

        return [lng, lat, alt]
      } catch (error) {
        console.warn(`Error parsing coordinate: ${coordStr}`, error)
        return [0, 0, 0]
      }
    })
  } catch (error) {
    console.error("Error parsing coordinates:", error)
    return []
  }
}

// Convert KML color (aabbggrr) to hex color (#rrggbb)
function kmlColorToHex(kmlColor: string): string {
  if (!kmlColor || kmlColor.length !== 8) return "#3700ff"

  // KML colors are in aabbggrr format, we need to convert to #rrggbb
  const alpha = kmlColor.substring(0, 2)
  const blue = kmlColor.substring(2, 4)
  const green = kmlColor.substring(4, 6)
  const red = kmlColor.substring(6, 8)

  return `#${red}${green}${blue}`
}

// Calculate distance between two points in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Calculate polygon area (approximate, in km²)
function calculatePolygonArea(coordinates: number[][]): number {
  if (coordinates.length < 3) return 0

  let area = 0
  const R = 6371 // Earth radius in km

  for (let i = 0; i < coordinates.length; i++) {
    const j = (i + 1) % coordinates.length

    const lat1 = (coordinates[i][1] * Math.PI) / 180
    const lon1 = (coordinates[i][0] * Math.PI) / 180
    const lat2 = (coordinates[j][1] * Math.PI) / 180
    const lon2 = (coordinates[j][0] * Math.PI) / 180

    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
  }

  area = Math.abs((area * R * R) / 2)
  return area
}
