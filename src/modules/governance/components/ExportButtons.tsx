import { FileText, Download, FileSpreadsheet, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExportButtons() {
  const handleExport = (type: 'summary' | 'evidence' | 'snapshot') => {
    // In a real implementation, this would trigger an API call to generate the export
    // For now, we'll just show a console log
    console.log(`Exporting ${type}...`)
    
    // Simulate download
    const filename = {
      summary: 'governance-summary.pdf',
      evidence: 'model-lifecycle-evidence.csv',
      snapshot: 'audit-snapshot.zip',
    }[type]

    // Create a dummy blob and trigger download
    const blob = new Blob(['Export content'], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Export & Evidence</h3>
        <p className="text-xs text-muted-foreground">
          Generate audit-ready exports for compliance purposes
        </p>
      </div>

      <div className="glass-panel rounded-xl p-3 border border-blue-500/30 bg-blue-500/10">
        <p className="text-xs text-blue-300">
          Exports are generated for audit and compliance purposes only.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent/20 relative"
          onClick={() => handleExport('summary')}
        >
          <div className="flex items-center gap-2 w-full">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Governance Summary</span>
          </div>
          <span className="text-xs text-muted-foreground">PDF format</span>
          <Download className="w-4 h-4 text-muted-foreground absolute top-3 right-3" />
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent/20 relative"
          onClick={() => handleExport('evidence')}
        >
          <div className="flex items-center gap-2 w-full">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Model Lifecycle Evidence</span>
          </div>
          <span className="text-xs text-muted-foreground">CSV format</span>
          <Download className="w-4 h-4 text-muted-foreground absolute top-3 right-3" />
        </Button>

        <Button
          variant="outline"
          className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-accent/20 relative"
          onClick={() => handleExport('snapshot')}
        >
          <div className="flex items-center gap-2 w-full">
            <Archive className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Audit Snapshot</span>
          </div>
          <span className="text-xs text-muted-foreground">ZIP format</span>
          <Download className="w-4 h-4 text-muted-foreground absolute top-3 right-3" />
        </Button>
      </div>
    </div>
  )
}
