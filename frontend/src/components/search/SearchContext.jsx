import { createContext, useContext, useState } from "react"

const defaultValues = {
  getFilters: () => [],
  updateFilters: () => {},
  clearFilters: () => {},
  clear: () => {},
  save: () => {}
}
const SearchContext = createContext(defaultValues);

export function SearchContextProvider({ children }) {

  const [filters, setFilters] = useState([])

  const updateFilters = (...filterExpressions) => {
    console.log('SearchContext.updateFilters', filterExpressions);

    // build up a set of field keys to remove from the set of active filters
    const filtersToReset = [...new Set(filterExpressions.map(expression => expression.field))];

    setFilters((prevState) => {
      return [...filterExpressions, ...prevState.filter(filter => !(filtersToReset.includes(filter.field)))];
    });
  }

  const clearFilters = (fieldName) => {
    console.log('SearchContext.clearFilters', fieldName);

    setFilters(prevState => {
      return [...prevState.filter(filter => filter.field !== fieldName)];
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

  const getFilters = () => filters;

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