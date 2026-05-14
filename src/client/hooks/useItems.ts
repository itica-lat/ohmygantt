import { useMemo } from 'react'
import { useProjectItems } from './useProject'
import { mapItemsToGantt, filterItems } from '@/lib/gantt'
import type { GanttItem } from '@/lib/gantt'

export type ItemFilters = {
  codes: string[]
  statuses: string[]
  assignees: string[]
  iterations: string[]
}

export function useItems(
  projectId: string,
  filters: ItemFilters = { codes: [], statuses: [], assignees: [], iterations: [] }
): {
  items: GanttItem[]
  allItems: GanttItem[]
  isLoading: boolean
  error: Error | null
  projectTitle: string
} {
  const { data, isLoading, error } = useProjectItems(projectId)

  const allItems = useMemo(() => {
    if (!data?.items) return []
    return mapItemsToGantt(data.items)
  }, [data])

  const items = useMemo(() => filterItems(allItems, filters), [allItems, filters])

  return {
    items,
    allItems,
    isLoading,
    error: error as Error | null,
    projectTitle: data?.title ?? '',
  }
}
