import { createFileRoute } from '@tanstack/react-router'
import VisualizeTree from '@/visualize/VisualizeTree'
import { SearchContextProvider } from '@/components/search/SearchContext.jsx'

export const Route = createFileRoute('/visualizetree/')({
  component: () => (
    <SearchContextProvider scope="visualize_tree">
      <VisualizeTree />
    </SearchContextProvider>
  ),
})
