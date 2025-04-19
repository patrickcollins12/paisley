import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from "zod";

import { pageSizeOptions } from '@/components/data-table/Pagination.jsx'
import TransactionPage from '@/transactions/TransactionPage.jsx'
import { createAuthenticatedFileRoute } from '@/auth/RouteHelpers.jsx'
import { SearchContextProvider } from '@/components/search/SearchContext.jsx'

const validPageSizes = pageSizeOptions.map(option => option.key);

const transactionSearchSchema = z.object({
    page: z.coerce.number().int().positive({ message: "Page must be greater than 0" }).default(1),
    page_size: z.coerce.number().refine(
        (value) => validPageSizes.includes(value),
        { message: `Page size must be one of: ${validPageSizes.join(', ')}` }
    ).default(100),
    description: z.string().optional(),
    order_by: z.string().regex(/^[a-z_]+,(asc|desc)$/, { message: "Order by must be in format 'column,(asc|desc)'" }).optional(),
    search_id: z.string().optional(),
});

export const Route = createAuthenticatedFileRoute('/transactions/', {
  component: () => (
    <SearchContextProvider scope="transactions">
      <TransactionPage />
    </SearchContextProvider>
  ),
  validateSearch: (search) => transactionSearchSchema.parse(search),
})
