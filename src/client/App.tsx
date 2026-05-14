import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import IndexRoute from './routes/index'
import DashboardRoute from './routes/dashboard'
import GanttRoute from './routes/gantt'
import MetricsRoute from './routes/metrics'
import ManualEditorRoute from './routes/manual-editor'
import ManualGanttRoute from './routes/manual-gantt'
import ManualSharedRoute from './routes/manual-shared'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/gantt/:projectId" element={<GanttRoute />} />
          <Route path="/metrics/:projectId" element={<MetricsRoute />} />
          <Route path="/manual/new" element={<ManualEditorRoute />} />
          <Route path="/manual/:projectId/edit" element={<ManualEditorRoute />} />
          <Route path="/manual/:projectId" element={<ManualGanttRoute />} />
          <Route path="/manual/shared/:shareId" element={<ManualSharedRoute />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
