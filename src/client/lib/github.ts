export type GithubUser = {
  login: string
  avatarUrl: string
  name: string
}

export type ProjectNode = {
  id: string
  number: number
  title: string
  url: string
  updatedAt: string
}

export type OrgNode = {
  login: string
  name: string
  avatarUrl: string
}

export type ProjectNodeWithOwner = ProjectNode & {
  ownerLogin: string
  ownerName: string
  ownerAvatarUrl?: string
}

export type ProjectFieldValue =
  | { __typename?: string; text: string; field: { name: string } }
  | { __typename?: string; date: string; field: { name: string } }
  | { __typename?: string; name: string; field: { name: string } }
  | { __typename?: string; number: number; field: { name: string } }
  | { __typename?: string; iterationId: string; title: string; startDate: string; duration: number; field: { name: string } }

export type Assignee = { login: string; avatarUrl: string }
export type Label = { name: string; color: string }

export type ProjectItemContent = {
  __typename?: 'Issue'
  title: string
  number: number
  url: string
  state: 'OPEN' | 'CLOSED'
  assignees: { nodes: Assignee[] }
  labels: { nodes: Label[] }
  createdAt: string
  closedAt: string | null
}

export type ProjectItem = {
  id: string
  type: string
  fieldValues: { nodes: ProjectFieldValue[] }
  content: ProjectItemContent
}

export type ProjectData = {
  title: string
  items: {
    pageInfo: { hasNextPage: boolean; endCursor: string }
    nodes: ProjectItem[]
  }
}

export async function githubQuery<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch('/api/github', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  })

  if (res.status === 401) {
    window.location.href = '/'
    throw new Error('Session expired')
  }

  if (!res.ok) throw new Error(`GraphQL proxy error: ${res.status}`)
  return res.json() as Promise<T>
}

export const LIST_PROJECTS_QUERY = `
  query ListProjects($login: String!) {
    user(login: $login) {
      projectsV2(first: 20) {
        nodes {
          id
          number
          title
          url
          updatedAt
        }
      }
      organizations(first: 30) {
        nodes {
          login
          name
          avatarUrl
        }
      }
    }
  }
`

export const LIST_ORG_PROJECTS_QUERY = `
  query ListOrgProjects($org: String!) {
    organization(login: $org) {
      projectsV2(first: 20) {
        nodes {
          id
          number
          title
          url
          updatedAt
        }
      }
    }
  }
`

export const GET_PROJECT_ITEMS_QUERY = `
  query GetProjectItems($projectId: ID!, $cursor: String) {
    node(id: $projectId) {
      ... on ProjectV2 {
        title
        items(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            type
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldTextValue {
                  text
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldDateValue {
                  date
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldNumberValue {
                  number
                  field { ... on ProjectV2FieldCommon { name } }
                }
                ... on ProjectV2ItemFieldIterationValue {
                  iterationId
                  title
                  startDate
                  duration
                  field { ... on ProjectV2FieldCommon { name } }
                }
              }
            }
            content {
              ... on Issue {
                title
                number
                url
                state
                assignees(first: 5) { nodes { login avatarUrl } }
                labels(first: 10) { nodes { name color } }
                createdAt
                closedAt
              }
            }
          }
        }
      }
    }
  }
`
