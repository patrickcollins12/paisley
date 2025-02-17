import Toolbar from "@/toolbar/Toolbar.jsx";
import { useFetchTransactions } from "@/transactions/TransactionApiHooks.jsx";
import { useSearch } from "@/components/search/SearchContext.jsx";

export default function VisualisePage() {

  // search context (this is NOT the search params but how search_ids are generated)
  const searchContext = useSearch();

  const { data } = useFetchTransactions({
    pageIndex: 0,
    pageSize: 10000,
    filters: searchContext.getFilters(),
    orderBy: null,
  });

  return (
    <>
      <Toolbar />

      <div>Transactions: {data?.results?.length}</div>
    </>
  )
};