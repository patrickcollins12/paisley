import { createFileRoute } from '@tanstack/react-router'
import VisualizeTrend from '@/visualize/VisualizeTrend'
import { SearchContextProvider } from '@/components/search/SearchContext.jsx'

export const Route = createFileRoute('/visualizetrend/')({
  component: () => (
    <SearchContextProvider scope="visualize_trend">
      <VisualizeTrend />
    </SearchContextProvider>
  ),
})
