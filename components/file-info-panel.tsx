import { FileText, FileArchiveIcon as FileZip, Info } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { KmlData } from "@/lib/types"

interface FileInfoPanelProps {
  kmlData: KmlData | null
  fileName: string | null
  fileSize: number | null
  fileType: "kml" | "kmz" | null
  isMobile?: boolean
}

export function FileInfoPanel({ kmlData, fileName, fileSize, fileType, isMobile = false }: FileInfoPanelProps) {
  if (!kmlData || !fileName) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center">
        <div>
          <Info className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum arquivo carregado</h3>
          <p className="mt-1 text-sm text-gray-500">Faça upload de um arquivo KML ou KMZ para visualizar informações</p>
        </div>
      </div>
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          {fileType === "kmz" ? (
            <FileZip className="h-10 w-10 text-[#ff3f19]" />
          ) : (
            <FileText className="h-10 w-10 text-[#3700ff]" />
          )}
          <div>
            <h3 className="font-medium">{fileName}</h3>
            <p className="text-sm text-gray-500">
              {fileType?.toUpperCase()} - {fileSize ? formatFileSize(fileSize) : "Tamanho desconhecido"}
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Informações do Arquivo</h4>
            <Separator className="my-2" />
            <dl className="grid grid-cols-3 gap-1 text-sm">
              <dt className="col-span-1 text-gray-500">Tipo</dt>
              <dd className="col-span-2">{fileType?.toUpperCase() || "Desconhecido"}</dd>

              <dt className="col-span-1 text-gray-500">Tamanho</dt>
              <dd className="col-span-2">{fileSize ? formatFileSize(fileSize) : "Desconhecido"}</dd>

              {kmlData.name && (
                <>
                  <dt className="col-span-1 text-gray-500">Nome do Documento</dt>
                  <dd className="col-span-2">{kmlData.name}</dd>
                </>
              )}

              {kmlData.description && (
                <>
                  <dt className="col-span-1 text-gray-500">Descrição</dt>
                  <dd className="col-span-2">{kmlData.description}</dd>
                </>
              )}
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900">Resumo do Conteúdo</h4>
            <Separator className="my-2" />
            <dl className="grid grid-cols-3 gap-1 text-sm">
              <dt className="col-span-1 text-gray-500">Total de Elementos</dt>
              <dd className="col-span-2">{kmlData.elements.length}</dd>

              <dt className="col-span-1 text-gray-500">Pontos</dt>
              <dd className="col-span-2">{kmlData.elements.filter((el) => el.type === "Point").length}</dd>

              <dt className="col-span-1 text-gray-500">Linhas</dt>
              <dd className="col-span-2">{kmlData.elements.filter((el) => el.type === "LineString").length}</dd>

              <dt className="col-span-1 text-gray-500">Polígonos</dt>
              <dd className="col-span-2">{kmlData.elements.filter((el) => el.type === "Polygon").length}</dd>

              <dt className="col-span-1 text-gray-500">Outros</dt>
              <dd className="col-span-2">
                {kmlData.elements.filter((el) => !["Point", "LineString", "Polygon"].includes(el.type)).length}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
