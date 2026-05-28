import { apiClient } from '@/shared/lib/api'

export type AIAction = 'improve_description' | 'generate_subtasks' | 'estimate_effort'

export interface AIContext {
  title: string
  description?: string
}

export interface EstimateResult {
  story_points: number
  priority: string
  reasoning: string
}

export type AIResult = string | string[] | EstimateResult

export const aiApi = {
  suggest: async (action: AIAction, context: AIContext): Promise<AIResult> => {
    const { data } = await apiClient.post<{ result: AIResult }>('/ai/suggest/', {
      action,
      context,
    })
    return data.result
  },
}
