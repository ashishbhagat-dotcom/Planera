import { useMutation } from '@tanstack/react-query'
import { aiApi, type AIAction, type AIContext, type AIResult } from '../services/aiApi'

export function useAISuggest() {
  return useMutation<AIResult, Error, { action: AIAction; context: AIContext }>({
    mutationFn: ({ action, context }) => aiApi.suggest(action, context),
  })
}
