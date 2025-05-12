import JSZip from "jszip"
import { parseKml } from "./kml-parser"
import type { KmlData } from "./types"

/**
 * Parse a KMZ file and extract the KML content
 * @param file The KMZ file to parse
 * @returns Parsed KML data
 */
export async function parseKmz(file: File): Promise<KmlData> {
  try {
    // Validate input
    if (!file) {
      throw new Error("No file provided")
    }

    if (!file.name.toLowerCase().endsWith(".kmz")) {
      throw new Error("Not a KMZ file")
    }

    console.log("Starting KMZ extraction for file:", file.name)

    // Load the KMZ file as a ZIP archive
    const zip = new JSZip()
    let zipContents
    try {
      zipContents = await zip.loadAsync(file)
      console.log("KMZ file loaded as ZIP successfully")
    } catch (error) {
      console.error("Failed to load KMZ as ZIP:", error)
      throw new Error("Invalid KMZ file: Not a valid ZIP archive")
    }

    // Log all files in the archive for debugging
    console.log("Files in KMZ archive:", Object.keys(zipContents.files))

    // Find the main KML file (usually doc.kml)
    let kmlFile = zipContents.file("doc.kml")

    // If doc.kml doesn't exist, try to find any .kml file
    if (!kmlFile) {
      const kmlFiles = Object.keys(zipContents.files).filter(
        (filename) => filename.toLowerCase().endsWith(".kml") && !zipContents.files[filename].dir,
      )

      console.log("KML files found in archive:", kmlFiles)

      if (kmlFiles.length === 0) {
        throw new Error("No KML file found in the KMZ archive")
      }

      kmlFile = zipContents.file(kmlFiles[0])
    }

    if (!kmlFile) {
      throw new Error("No KML file found in the KMZ archive")
    }

    console.log("Found KML file in archive:", kmlFile.name)

    // Extract the KML content
    let kmlContent
    try {
      kmlContent = await kmlFile.async("string")
      console.log("KML content extracted successfully, length:", kmlContent.length)

      // Log a preview of the content for debugging
      console.log("KML content preview:", kmlContent.substring(0, 200) + "...")
    } catch (error) {
      console.error("Failed to extract KML content:", error)
      throw new Error("Failed to extract KML content from KMZ file")
    }

    // Validate the KML content
    if (!kmlContent || kmlContent.trim() === "") {
      throw new Error("Extracted KML file is empty")
    }

    // Extract any images or other resources (for future use)
    const resources = new Map<string, string>()
    const imageFiles = Object.keys(zipContents.files).filter(
      (filename) => /\.(png|jpg|jpeg|gif|svg)$/i.test(filename) && !zipContents.files[filename].dir,
    )

    console.log("Image files found in archive:", imageFiles)

    for (const imageFile of imageFiles) {
      try {
        const imageBlob = await zipContents.file(imageFile)?.async("blob")
        if (imageBlob) {
          const imageUrl = URL.createObjectURL(imageBlob)
          resources.set(imageFile, imageUrl)
        }
      } catch (error) {
        console.warn(`Failed to extract image ${imageFile}:`, error)
        // Continue with other images
      }
    }

    // Parse the KML content
    try {
      const kmlData = await parseKml(kmlContent)
      console.log("KML parsed successfully, elements:", kmlData.elements.length)
      return kmlData
    } catch (error) {
      console.error("Error parsing extracted KML:", error)
      throw error
    }
  } catch (error) {
    console.error("Error parsing KMZ file:", error)
    throw error instanceof Error ? error : new Error("Failed to parse KMZ file")
  }
}
