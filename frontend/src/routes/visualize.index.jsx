import { createFileRoute } from '@tanstack/react-router'
import VisualizePage from '@/visualize/VisualizePage'
import { SearchContextProvider } from '@/components/search/SearchContext.jsx'

export const Route = createFileRoute('/visualize/')({
  component: () => (
    <SearchContextProvider>
      <VisualizePage />
    </SearchContextProvider>
  ),
})
