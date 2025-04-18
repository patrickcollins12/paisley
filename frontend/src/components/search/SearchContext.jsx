import { createContext, useContext, useEffect, useState } from "react"
import { useLocalStorage } from "react-use"
import { filterExpression, getOperatorById } from "@/toolbar/FilterExpression.jsx"
import { useSavedSearches } from "./SavedSearchesHook.js"
import { SaveSearchDialog } from "./SaveSearchDialog.jsx"
import { toast } from "@/components/ui/use-toast"

const defaultValues = {
  scope: '',
  getFilters: () => [],
  updateFilters: () => {},
  clearFilters: () => {},
  isFilterActive: () => {},
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

export function SearchContextProvider({ children, scope }) {
  if (!scope) {
    throw new Error("SearchContextProvider requires a 'scope' prop.");
  }

  const [toolbarStates, setToolbarStates] = useLocalStorage('toolbar-states', {});

  const [filters, setFilters] = useState(() => {
    const savedState = toolbarStates?.[scope];
    if (!savedState) return [];

    return savedState.map(hydrateOperatorDefinition).filter(x => x !== null);
  });

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [filtersToSave, setFiltersToSave] = useState(null);

  const {
    savedSearchList,
    isLoading: isLoadingSearches,
    error: errorLoadingSearches,
    saveSearch: saveSearchAPI,
    deleteSearch,
    getSearch: getSearchAPI
  } = useSavedSearches();

  const getHashableFilterState = (filterState) => {
    if (!filterState) return [];
    return filterState.map(filter => ({
      field: filter.field,
      operatorId: filter.operatorDefinition.id,
      value: filter.value
    }));
  }

  const updateFilters = (...filterExpressions) => {
    const filtersToReset = [...new Set(filterExpressions.map(expression => expression.field))];
    setFilters((prevState) => {
      const validPrevState = Array.isArray(prevState) ? prevState : [];
      return [...filterExpressions, ...validPrevState.filter(filter => !(filtersToReset.includes(filter.field)))];
    });
  }

  const clearFilters = (...fieldNames) => {
    setFilters(prevState => {
      const validPrevState = Array.isArray(prevState) ? prevState : [];
      if (!validPrevState.some(f => fieldNames.includes(f.field))) return validPrevState;
      return [...validPrevState.filter(filter => !fieldNames.includes(filter.field))];
    })
  }

  const isFilterActive = (...fieldNames) => {
    const validFilters = Array.isArray(filters) ? filters : [];
    return validFilters.some(f => fieldNames.includes(f.field));
  }

  const clear = () => {
    setFilters([]);
    setToolbarStates(prevStates => ({
      ...prevStates,
      [scope]: []
    }));
  }

  const save = async () => {
    const currentFilters = getHashableFilterState(filters);
    if (!currentFilters || currentFilters.length === 0) {
      toast({ description: 'No filters active to save.', variant: "destructive" });
      return;
    }
    setFiltersToSave(currentFilters);
    setIsSaveDialogOpen(true);
  }

  const handleSaveSubmit = async (name) => {
    if (!filtersToSave || !name) return;

    try {
      const result = await saveSearchAPI(name, filtersToSave);
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
    let result;
    try {
      result = await getSearchAPI(name);
      if (!result.success) throw new Error(result.error || 'Failed to fetch search data from API.');
      if (!result.data) {
        throw new Error('Saved search data format is invalid or missing.');
      }
    } catch (error) {
      console.error(`Failed to fetch or validate search data for "${name}":`, error);
      toast({ description: `Error fetching search: ${error.message}`, variant: "destructive" });
      return;
    }

    try {
      const loadedFilters = result.data.value;
      const hydratedFilters = loadedFilters.map(hydrateOperatorDefinition).filter(x => x !== null);
      if (hydratedFilters.length !== loadedFilters.length) {
        console.warn(`Search "${name}" loaded, but some filters could not be hydrated due to missing operator definitions.`);
      }
      setFilters(hydratedFilters);
    } catch (hydrationError) {
      console.error(`Failed to process or apply search filters for "${name}":`, hydrationError);
      toast({ description: `Error applying search filters: ${hydrationError.message}`, variant: "destructive" });
    }
  };

  const handleDeleteSearch = async (name) => {
    try {
      const result = await deleteSearch(name);
      if (!result.success) throw new Error(result.error || 'Failed to delete search from API.');
      toast({ description: `Search "${name}" deleted successfully.` });
    } catch (error) {
      console.error(`Failed to delete search "${name}":`, error);
      toast({ description: `Error deleting search: ${error.message}`, variant: "destructive" });
    }
  };

  const getFilters = (...fields) => {
    const validFilters = Array.isArray(filters) ? filters : [];
    if (fields.length === 0) return validFilters;
    return validFilters.filter(f => fields.includes(f.field));
  }

  useEffect(() => {
    const hashableState = getHashableFilterState(filters);
    setToolbarStates(prevStates => ({ ...prevStates, [scope]: hashableState }));
  }, [filters, scope, setToolbarStates]);

  return (
    <>
      <SearchContext.Provider value={{
        scope,
        filters,
        getFilters,
        isFilterActive,
        updateFilters,
        clearFilters,
        clear,
        save,
        savedSearches: savedSearchList?.map(item => item.key) || [],
        loadSearch,
        deleteSearch: handleDeleteSearch
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