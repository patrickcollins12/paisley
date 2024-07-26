import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate, useSearch as useSearchParams } from "@tanstack/react-router"
import { v5 as uuidv5 } from 'uuid';
import { useLocalStorage } from "react-use"
import { filterExpression, getOperatorById } from "@/toolbar/FilterExpression.jsx"

const uuidNamespace = '246734d0-39cc-4481-bd88-76e80f1649ff';
const searchHistoryLimit = 250;
const defaultValues = {
  getFilters: () => [],
  updateFilters: () => {},
  clearFilters: () => {},
  clear: () => {},
  save: () => {}
}
const SearchContext = createContext(defaultValues);

const hydrateOperatorDefinition = (filter) => {
  const operatorDefinition = getOperatorById(filter.operatorId);

  if (!operatorDefinition) {
    console.error(`SearchContext.hydrateOperatorDefinition: Failed to find operator definition for id '${filter.operatorId}'.`);
    return null;
  }

  return filterExpression(filter.field, operatorDefinition, filter.value);
}

export function SearchContextProvider({ children }) {

  const searchParams = useSearchParams({ strict: true });
  const [localStorage, setLocalStorage] = useLocalStorage('search-history', []);
  const [filters, setFilters] = useState(() => {
    if (!('search_id' in searchParams)) return [];

    const existingSearch = localStorage.find(history => history.searchId === searchParams.search_id);
    if (!existingSearch) return [];

    // attempt to hydrate the operator definition based on the operator id
    // filter out any NuLL elements since we failed to find the operator definition for these
    return existingSearch.filters.map(hydrateOperatorDefinition).filter(x => x !== null);
  });

  const navigate = useNavigate();

  const updateSearchHistory = (searchId, filters) => {
    // try to find the search id in the existing search history
    // don't do anything if the search is already saved
    const existingEntry = localStorage.find(f => f.searchId === searchId);
    if (existingEntry) return;

    // trim the search history if needed
    const trimmed = localStorage.length > (searchHistoryLimit - 1) ? localStorage.slice(1) : localStorage;

    setLocalStorage([...trimmed, {
      searchId,
      filters
    }]);
  }
  const updateSearchParams = async (filterState) => {
    console.log('SearchContext.updateSearchParams', filterState);

    // strip each filter expression down to only the necessary pieces required to re-hydrade the definition later
    const hashableFilterState = filterState.map(filter => ({
      field: filter.field,
      operatorId: filter.operatorDefinition.id,
      value: filter.value
    }));

    // generate a deterministic search id based on the current search configuration
    const searchId = uuidv5(JSON.stringify(hashableFilterState), uuidNamespace);

    // update the search history (in localstorage)
    updateSearchHistory(searchId, hashableFilterState);

    // update the search params
    await navigate({
      search: prevSearchState => {
        if (filterState.length === 0) {
          const { search_id, ...newSearchState } = prevSearchState;
          return newSearchState;
        }

        return { ...prevSearchState, search_id: searchId };
      }
    });
  }

  const updateFilters = (...filterExpressions) => {
    console.log('SearchContext.updateFilters', filterExpressions);

    // build up a set of field keys to remove from the set of active filters
    const filtersToReset = [...new Set(filterExpressions.map(expression => expression.field))];

    setFilters((prevState) => {
      return [...filterExpressions, ...prevState.filter(filter => !(filtersToReset.includes(filter.field)))];
    });
  }

  const clearFilters = (...fieldNames) => {
    console.log('SearchContext.clearFilters', fieldNames);

    setFilters(prevState => {
      return [...prevState.filter(filter => !fieldNames.includes(filter.field))];
    })
  }

  const clear = () => {
    console.log('SearchContext.clear');
    // TODO: Wire up the filter buttons so they know how to respond to this happening
    // setFilters([]);
  }

  const save = () => {
    console.log('SearchContext.save');
    // TODO: Save search configuration somehow (maybe via localstorage for now)
  }

  const getFilters = (...fields) => {
    if (fields.length === 0) return filters;

    if (fields.length > 0) {
      return filters.filter(f => fields.includes(f.field));
    }
  }

  useEffect(() => {
    const update = async () => {
      await updateSearchParams(filters);
    }

    update().catch(console.error);
  }, [filters]);

  return (
    <SearchContext.Provider value={{
      getFilters,
      updateFilters,
      clearFilters,
      clear,
      save
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const searchContext = useContext(SearchContext);
  if (!searchContext) {
    throw new Error('useSearch must be provided within SearchContextProvider')
  }
  return searchContext;
}