import { createFileRoute, redirect } from '@tanstack/react-router'
import Joi from 'joi'

import { pageSizeOptions } from "@/components/data-table/Pagination.jsx"
import TreeMapPage from "@/reports/TreeMapPage.jsx"
import { createAuthenticatedFileRoute } from "@/auth/RouteHelpers.jsx"
import { SearchContextProvider } from "@/components/search/SearchContext.jsx"

/*
 Setup JOI based schema for validating search parameters
 Page must be a positive number.
 Page size must be a positive number based on the size options in our pagination.
 Filter must be a string (probably need some more validation)
 Order By must be a string that matches the pattern <column name>,<sort order>
 JOI: https://joi.dev/
*/
const schema = Joi.object({
  page: Joi.number().greater(0).default(1),
  page_size: Joi.number().valid(...pageSizeOptions.map(x => x.key)).default(100),
  description: Joi.string().optional(),
  order_by: Joi.string().optional().pattern(/^[a-z]*,(asc|desc)$/),
  search_id: Joi.string().optional()
});

export const Route = createAuthenticatedFileRoute('/treemap/',{
  component: () => (
    <SearchContextProvider>
      <TreeMapPage />
    </SearchContextProvider>
  ),
  validateSearch: search => {
    const { error, value: validatedSearch } = schema.validate(search);
    if (error) {
      console.error('Error validating search params', error);
      return {
        page: 1,
        page_size: pageSizeOptions[0].key
      }
    }

    return validatedSearch;
  }
});