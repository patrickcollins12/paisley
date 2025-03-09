import { createFileRoute } from '@tanstack/react-router'
import VisualisePage from '@/visualise/VisualisePage'
import { SearchContextProvider } from '@/components/search/SearchContext.jsx'

export const Route = createFileRoute('/visualise/')({
  component: () => (
    <SearchContextProvider>
      <VisualisePage />
    </SearchContextProvider>
  ),
})
