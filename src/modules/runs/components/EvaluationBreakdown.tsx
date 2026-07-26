import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RunResultData } from '../store/runStore'

interface EvaluationBreakdownProps {
  resultData: RunResultData
}

/**
 * EvaluationBreakdown - Collapsible evaluation metrics (confusion matrix, ROC/AUC, precision/recall/F1)
 * Module 6 - Results & Evaluation (POST-Training)
 */
export function EvaluationBreakdown({ resultData }: EvaluationBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasEvaluationData =
    resultData.confusionMatrix ||
    resultData.rocAuc !== undefined ||
    resultData.precision !== undefined ||
    resultData.recall !== undefined ||
    resultData.f1Score !== undefined

  if (!hasEvaluationData) {
    return null
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-semibold text-foreground">Evaluation Breakdown</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Confusion Matrix */}
          {resultData.confusionMatrix && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Confusion Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-border p-2 text-xs text-muted-foreground">Actual \ Predicted</th>
                      {resultData.confusionMatrix[0]?.map((_, colIdx) => (
                        <th key={colIdx} className="border border-border p-2 text-xs text-muted-foreground">
                          Class {colIdx}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.confusionMatrix.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        <td className="border border-border p-2 text-xs font-medium text-muted-foreground">
                          Class {rowIdx}
                        </td>
                        {row.map((value, colIdx) => (
                          <td
                            key={colIdx}
                            className={cn(
                              'border border-border p-2 text-xs text-center font-medium',
                              rowIdx === colIdx
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/10 text-foreground'
                            )}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROC / AUC */}
          {resultData.rocAuc !== undefined && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">ROC / AUC</h3>
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg bg-accent/30">
                  <p className="text-xs text-muted-foreground mb-1">AUC Score</p>
                  <p className="text-xl font-bold text-foreground">{resultData.rocAuc.toFixed(4)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {resultData.rocAuc >= 0.9
                    ? 'Excellent'
                    : resultData.rocAuc >= 0.8
                    ? 'Good'
                    : resultData.rocAuc >= 0.7
                    ? 'Fair'
                    : 'Poor'}
                </p>
              </div>
            </div>
          )}

          {/* Precision / Recall / F1 */}
          {(resultData.precision !== undefined ||
            resultData.recall !== undefined ||
            resultData.f1Score !== undefined) && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Classification Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resultData.precision !== undefined && (
                  <div className="px-4 py-3 rounded-lg bg-accent/30">
                    <p className="text-xs text-muted-foreground mb-1">Precision</p>
                    <p className="text-xl font-bold text-foreground">{(resultData.precision * 100).toFixed(2)}%</p>
                  </div>
                )}
                {resultData.recall !== undefined && (
                  <div className="px-4 py-3 rounded-lg bg-accent/30">
                    <p className="text-xs text-muted-foreground mb-1">Recall</p>
                    <p className="text-xl font-bold text-foreground">{(resultData.recall * 100).toFixed(2)}%</p>
                  </div>
                )}
                {resultData.f1Score !== undefined && (
                  <div className="px-4 py-3 rounded-lg bg-accent/30">
                    <p className="text-xs text-muted-foreground mb-1">F1 Score</p>
                    <p className="text-xl font-bold text-foreground">{(resultData.f1Score * 100).toFixed(2)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
