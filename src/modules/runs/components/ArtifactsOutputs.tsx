import { Download, FileText, Package, Settings, FileArchive, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RunResultData } from '../store/runStore'

interface ArtifactsOutputsProps {
  artifacts?: RunResultData['artifacts']
}

/**
 * ArtifactsOutputs - Display run artifacts (read-only)
 * Module 6 - Results & Evaluation (POST-Training)
 */
export function ArtifactsOutputs({ artifacts }: ArtifactsOutputsProps) {
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Artifacts & Outputs</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No artifacts available</p>
          <p className="text-xs mt-1">Artifacts will appear here after training completes</p>
        </div>
      </div>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'model':
        return Package
      case 'metrics':
        return FileText
      case 'config':
        return Settings
      case 'logs':
        return FileArchive
      default:
        return FileText
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Artifacts & Outputs</h2>
      <div className="space-y-2">
        {artifacts.map((artifact, index) => {
          const Icon = getIcon(artifact.type)
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{artifact.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(artifact.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    // Placeholder - in real app, this would open metadata viewer
                    console.log('View metadata:', artifact)
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    // Placeholder - in real app, this would trigger download
                    console.log('Download:', artifact.path)
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
