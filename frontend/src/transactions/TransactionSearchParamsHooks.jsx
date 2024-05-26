import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import { useUpdateEffect } from "react-use"

const routeApi = getRouteApi('/transactions/');

/**
 * Converts filtering related search parameters back to state usable by TAN Datatable.
 * @param searchParams
 * @returns {[{id: string, value}]|*[]}
 */
function filterStateFromSearchParams(searchParams) {
  if (!searchParams?.description) {
    return [];
  }

  return [{
    id: 'description',
    value: searchParams.description
  }];
}

/**
 * Converts sorting related search parameters back to state usable by TAN Datatable.
 * @param searchParams
 * @returns {[{id: string, desc: boolean}]|*[]}
 */
function sortStateFromSearchParams(searchParams) {
  if (!searchParams?.order_by) {
    return [];
  }

  const orderbyParts = searchParams.order_by.split(',');
  if (orderbyParts.length !== 2) {
    return [];
  }

  return [{
    id: orderbyParts[0],
    desc: orderbyParts[1] === 'desc'
  }];
}

/**
 * Converts pagination related search parameters back to state usable by TAN Datatable.
 * @param searchParams
 * @returns {{pageIndex: number, pageSize: *}}
 */
function pageStateFromSearchParams(searchParams) {
  return {
    pageIndex: searchParams.page - 1,
    pageSize: searchParams.page_size
  }
}

/**
 * Converts current data table state into search parameters.
 * @param filterState Current filtering state
 * @param sortState Current sorting state
 * @param pageState Current page state
 * @returns {{page: *, page_size: *}}
 */
function searchParamsFromState(filterState, sortState, pageState) {
  let filterParams = {};
  const descriptionFilter = filterState.find(filter => filter.id === 'description')
  if (descriptionFilter) {
    filterParams['description'] = descriptionFilter.value;
  }

  let sortParams = {};
  if (sortState.length > 0) {
    sortParams['order_by'] = `${sortState[0].id},${sortState[0].desc ? 'desc' : 'asc'}`;
  }

  return {
    page: pageState.pageIndex + 1,
    page_size: pageState.pageSize,
    ...sortParams,
    ...filterParams
  }
}

/**
 * Sets up state for all things that are managed through search parameters.
 * Sets up automatic updates of search parameters when the associated state changes.
 * Filtering, sorting and pagination is currently managed through search params.
 * @returns {{setFilterState: (value: (((prevState: *[]) => *[]) | *[])) => void, setSortState: (value: (((prevState: *[]) => *[]) | *[])) => void, filterState: *[], sortState: *[], setPageState: (value: (((prevState: {pageIndex, pageSize: *}) => {pageIndex, pageSize: *}) | {pageIndex, pageSize: *})) => void, pageState: {pageIndex, pageSize: *}}}
 */
export function useTransactionSearchParams() {
  const searchParams = routeApi.useSearch();
  const updateSearchParams = routeApi.useNavigate();
  const [filterState, setFilterState] = useState([...filterStateFromSearchParams(searchParams)])
  const [sortState, setSortState] = useState([...sortStateFromSearchParams(searchParams)]);
  const [pageState, setPageState] = useState({...pageStateFromSearchParams(searchParams)});

  useUpdateEffect(() => {
    updateSearchParams({
      search: {...searchParamsFromState(filterState, sortState, pageState)}
    })
  }, [filterState, sortState, pageState]);

  return {
    filterState, setFilterState,
    sortState, setSortState,
    pageState, setPageState
  }
}