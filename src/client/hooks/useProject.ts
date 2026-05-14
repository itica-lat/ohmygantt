import { useQuery } from '@tanstack/react-query'
import {
  githubQuery,
  LIST_PROJECTS_QUERY,
  LIST_ORG_PROJECTS_QUERY,
  GET_PROJECT_ITEMS_QUERY,
} from '@/lib/github'
import type { ProjectNode, ProjectNodeWithOwner, OrgNode, ProjectItem, ProjectData } from '@/lib/github'

type ListProjectsResponse = {
  data: {
    user: {
      projectsV2: { nodes: ProjectNode[] }
      organizations: { nodes: OrgNode[] }
    }
  }
}

type ListOrgProjectsResponse = {
  data: {
    organization: {
      projectsV2: { nodes: ProjectNode[] }
    }
  }
}

type ProjectItemsResponse = {
  data: { node: ProjectData }
}

export type ListProjectsResult = {
  projects: ProjectNodeWithOwner[]
  blockedOrgs: OrgNode[]
}

export function useListProjects(login: string) {
  return useQuery({
    queryKey: ['projects', login],
    queryFn: async (): Promise<ListProjectsResult> => {
      const res = await githubQuery<ListProjectsResponse>(LIST_PROJECTS_QUERY, { login })

      const userProjects: ProjectNodeWithOwner[] = (
        res.data?.user?.projectsV2?.nodes ?? []
      ).map((p) => ({ ...p, ownerLogin: login, ownerName: login }))

      const orgs: OrgNode[] = res.data?.user?.organizations?.nodes ?? []

      const orgResults = await Promise.allSettled(
        orgs.map(async (org): Promise<ProjectNodeWithOwner[]> => {
          const orgRes = await githubQuery<ListOrgProjectsResponse>(
            LIST_ORG_PROJECTS_QUERY,
            { org: org.login }
          )
          return (orgRes.data?.organization?.projectsV2?.nodes ?? []).map((p) => ({
            ...p,
            ownerLogin: org.login,
            ownerName: org.name || org.login,
            ownerAvatarUrl: org.avatarUrl,
          }))
        })
      )

      const orgProjects = orgResults
        .filter((r): r is PromiseFulfilledResult<ProjectNodeWithOwner[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)

      const blockedOrgs = orgs.filter((_, i) => orgResults[i].status === 'rejected')

      return { projects: [...userProjects, ...orgProjects], blockedOrgs }
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!login,
  })
}

export function useProjectItems(projectId: string) {
  return useQuery({
    queryKey: ['project', projectId, 'items'],
    queryFn: async (): Promise<{ title: string; items: ProjectItem[] }> => {
      let cursor: string | null = null
      let allItems: ProjectItem[] = []
      let title = ''

      do {
        const res: ProjectItemsResponse = await githubQuery<ProjectItemsResponse>(
          GET_PROJECT_ITEMS_QUERY,
          { projectId, cursor }
        )
        const node: ProjectData | undefined = res.data?.node
        if (!node) break
        title = node.title
        allItems = [...allItems, ...node.items.nodes]
        cursor = node.items.pageInfo.hasNextPage ? node.items.pageInfo.endCursor : null
      } while (cursor)

      return { title, items: allItems }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!projectId,
  })
}
