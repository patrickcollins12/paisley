import { createContext, useContext, useEffect, useState } from "react"
import { useNavigate, useSearch as useSearchParams } from "@tanstack/react-router"
import { v5 as uuidv5 } from 'uuid';
import { useLocalStorage } from "react-use"
import { filterExpression, getOperatorById } from "@/toolbar/FilterExpression.jsx"
import { useSavedSearches } from "./SavedSearchesHook.js"
import { SaveSearchDialog } from "./SaveSearchDialog.jsx"
import { toast } from "@/components/ui/use-toast"

const uuidNamespace = '246734d0-39cc-4481-bd88-76e80f1649ff'; // namespace for search id generation
const searchHistoryLimit = 10; // limits the number of recent searches we store in local storage
const defaultValues = {
  getFilters: () => [],
  updateFilters: () => {},
  clearFilters: () => {},
  isFilterActive: () => {},
  calculateSearchId: () => {},
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
    // filter out any NULL elements since we failed to find the operator definition for these
    return existingSearch.filters.map(hydrateOperatorDefinition).filter(x => x !== null);
  });
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [filtersToSave, setFiltersToSave] = useState(null); // Store filters when dialog opens

  const {
    savedSearchList, // Raw list from API
    isLoading: isLoadingSearches,
    error: errorLoadingSearches,
    saveSearch: saveSearchAPI,
    deleteSearch, // Uncommented and assigned from hook
    getSearch: getSearchAPI
  } = useSavedSearches();

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

  const getHashableFilterState = (filterState) => {
    return filterState.map(filter => ({
      field: filter.field,
      operatorId: filter.operatorDefinition.id,
      value: filter.value
    }));
  }

  const calculateSearchId = () => {
    // strip each filter expression down to only the necessary pieces required to re-hydrade the definition later
    const hashableFilterState = getHashableFilterState(filters);

    // generate a deterministic search id based on the current search configuration
    return uuidv5(JSON.stringify(hashableFilterState), uuidNamespace);
  }

  const updateSearchParams = async () => {
    // console.log('SearchContext.updateSearchParams', filterState);

    const searchId = calculateSearchId();

    // update the search history (in localstorage)
    updateSearchHistory(searchId, getHashableFilterState(filters));

    // update the search params
    await navigate({
      search: prevSearchState => {
        if (filters.length === 0) {
          const { search_id, ...newSearchState } = prevSearchState;
          return newSearchState;
        }

        return { ...prevSearchState, search_id: searchId };
      }
    });
  }

  /**
   * Updates the current set of active filter expressions.
   * Note: This will remove prior expressions that are already active for fields in the supplied in filterExpressions.
   * @param {...FilterExpression} filterExpressions
   */
  const updateFilters = (...filterExpressions) => {
    // console.log('SearchContext.updateFilters', filterExpressions);

    // build up a set of field keys to remove from the set of active filters
    const filtersToReset = [...new Set(filterExpressions.map(expression => expression.field))];

    setFilters((prevState) => {
      return [...filterExpressions, ...prevState.filter(filter => !(filtersToReset.includes(filter.field)))];
    });
  }

  /**
   * Clears any active filters for one or more fields.
   * @param {...string} fieldNames Fields to clear filters for.
   */
  const clearFilters = (...fieldNames) => {
    if (!filters.some(f => fieldNames.includes(f.field))) return;

    setFilters(prevState => {
      return [...prevState.filter(filter => !fieldNames.includes(filter.field))];
    })
  }

  const isFilterActive = (...fieldNames) => {
    return filters.some(f => fieldNames.includes(f.field));
  }

  const clear = () => {
    // console.log('SearchContext.clear');
    setFilters([]); // Clear the local filter state
  }

  const save = async () => {
    const currentFilters = getHashableFilterState(filters);
    if (currentFilters.length === 0) {
      toast({ description: 'No filters active to save.', variant: "destructive" });
      return;
    }

    setFiltersToSave(currentFilters);
    setIsSaveDialogOpen(true);
  }

  const handleSaveSubmit = async (name) => {
    if (!filtersToSave || !name) return;

    try {
      const result = await saveSearchAPI(name, filtersToSave); // Use hook function
      if (!result.success) throw new Error(result.error);
      toast({ description: `Search "${name}" saved successfully!` });
    } catch (error) {
      console.error("Failed to save search:", error);
      toast({ description: `Error saving search: ${error.message}`, variant: "destructive" });
    } finally {
      setFiltersToSave(null);
      setIsSaveDialogOpen(false);
    }
  }

  const loadSearch = async (name) => {
    console.log(`[SearchContext] loadSearch called for name: "${name}"`);
    let result;
    try {
      result = await getSearchAPI(name); // Use hook function
      if (!result.success) throw new Error(result.error || 'Failed to fetch search data from API.');

      // Basic check if data structure is as expected after successful API call
      if (!result.data) {
        // This case might indicate an unexpected API response format even if success was true
        throw new Error('Saved search data format is invalid or missing.');
      }
    } catch (error) {
      console.error(`Failed to fetch or validate search data for "${name}":`, error);
      toast({ description: `Error fetching search: ${error.message}`, variant: "destructive" });
      return; // Stop execution if fetching failed
    }

    // --- Hydration Step ---
    try {
      const loadedFilters = result.data.value; 
      // console.log(`[SearchContext] Raw filters from API for "${name}":`, loadedFilters);
      
      /* // --- DEBUGGING HYDRATION --- 
      const hydratedFilters = [];
      console.log(`[SearchContext] Starting manual hydration loop for ${loadedFilters.length} filters...`);
      for (const rawFilter of loadedFilters) {
        console.log(`[SearchContext] Hydrating raw filter:`, rawFilter);
        const hydrated = hydrateOperatorDefinition(rawFilter);
        console.log(`[SearchContext] Result of hydrating filter for field '${rawFilter.field}':`, hydrated);
        if (hydrated !== null) {
          hydratedFilters.push(hydrated);
        } else {
          console.warn(`[SearchContext] Filter for field '${rawFilter.field}' was null after hydration.`);
        }
      }
      console.log(`[SearchContext] Manual hydration loop finished. Final hydratedFilters array:`, hydratedFilters);
      // --- END DEBUGGING --- */

      // Rehydrate operator definitions (Restored original line)
      const hydratedFilters = loadedFilters.map(hydrateOperatorDefinition).filter(x => x !== null);
      // console.log(`[SearchContext] Hydrated filters for "${name}":`, hydratedFilters); 

      // Optional: Warn if some filters couldn't be hydrated, but don't treat as a fatal error
      if (hydratedFilters.length !== loadedFilters.length) {
        console.warn(`Search "${name}" loaded, but some filters could not be hydrated due to missing operator definitions.`); // Restored original warning message
        // You could add a non-destructive toast here if desired:
        // toast({ description: `Search "${name}" loaded with some missing filter types.`, variant: "default" });
      }

      // console.log(`[SearchContext] Calling setFilters for "${name}" with ${hydratedFilters.length} filters...`);
      setFilters(hydratedFilters); // Update the main filter state
      // console.log(`[SearchContext] setFilters called for "${name}".`);
      // toast({ description: `Search "${name}" loaded successfully.` });

    } catch (hydrationError) {
      // Catch unexpected errors during the hydration/state update process
      console.error(`Failed to process or apply search filters for "${name}":`, hydrationError);
      toast({ description: `Error applying search filters: ${hydrationError.message}`, variant: "destructive" });
    }
  };

  // New handler for deleting a search
  const handleDeleteSearch = async (name) => {
    try {
      // We could add a window.confirm() here if needed
      // if (!window.confirm(`Are you sure you want to delete the search "${name}"?`)) {
      //   return;
      // }
      const result = await deleteSearch(name); // Call the function from the hook
      if (!result.success) throw new Error(result.error || 'Failed to delete search from API.');
      toast({ description: `Search "${name}" deleted successfully.` });
      // The useSavedSearches hook should handle updating the savedSearchList automatically
    } catch (error) {
      console.error(`Failed to delete search "${name}":`, error);
      toast({ description: `Error deleting search: ${error.message}`, variant: "destructive" });
    }
  };

  const getFilters = (...fields) => {
    if (fields.length === 0) return filters;

    if (fields.length > 0) {
      return filters.filter(f => fields.includes(f.field));
    }
  }

  useEffect(() => {
    const update = async () => {
      await updateSearchParams();
    }
    update().catch(error => {
    });
  }, [filters]);

  return (
    <>
      <SearchContext.Provider value={{
        filters,
        getFilters,
        isFilterActive,
        updateFilters,
        clearFilters,
        calculateSearchId,
        clear,
        save,
        savedSearches: savedSearchList?.map(item => item.key) || [], // Extract names for Toolbar
        loadSearch,     // Expose load function
        deleteSearch: handleDeleteSearch // Expose delete handler
      }}>
        {children}
      </SearchContext.Provider>

      <SaveSearchDialog 
        isOpen={isSaveDialogOpen}
        onOpenChange={setIsSaveDialogOpen}
        onSave={handleSaveSubmit}
      />
    </>
  )
}

export function useSearch() {
  const searchContext = useContext(SearchContext);
  if (!searchContext) {
    throw new Error('useSearch must be provided within SearchContextProvider')
  }
  return searchContext;
}