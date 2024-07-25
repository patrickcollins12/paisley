import useSWR from "swr";
import httpClient from "@/lib/httpClient.js"

async function updater(id, data) {
  console.log('updater', id, data);
  try {

    if (id === undefined) {
      throw new Error('ID is required for the update operation.');
    }

    const requestBody = { id };
    var update = false

    if (data?.manual_tags) {
      requestBody.tags = data.manual_tags;
      update = true;
    }

    if (data?.manual_party) {
      requestBody.party = data.manual_party;
      update = true;
    }

    // Include `autoCategorize` if it's not undefined, allowing `false` as a valid value
    if (data?.auto_categorize === true || data?.auto_categorize === false) {
      requestBody.auto_categorize = data.auto_categorize ? 1 : 0;
      update = true;
    }

    if (data.description !== undefined) {
      requestBody.description = data.description?.trim();
      update = true;
    }

    if (update) {
      console.log("POST: ", JSON.stringify(requestBody, null, "\t"))

      const response = await httpClient.post('update_transaction', requestBody);
      if (response.data.success) {
        return true;
      }
    }
    else {
      return false;
    }

  } catch (error) {
    console.error('Update transaction failed', error);
    return false;
  }
}

async function fetcher([url, options]) {
  // console.log('fetcher', options);

  const filters = options.filters?.reduce((accumulator, filter) => {
    const filterKey = `filter[${filter.field}][${filter.operatorDefinition.operator}]`;
    const filterValue = filter.operatorDefinition.formatValue?.(filter.value) ?? filter.value;
    accumulator[filterKey] = filter.operatorDefinition.operatorOnly ? '' : filterValue;
    return accumulator;
  }, {});

  const response = await httpClient.get(url, {
    params: {
      page: options?.pageIndex + 1,
      page_size: options?.pageSize,
      order_by: options?.orderBy ? `${options.orderBy.field},${options.orderBy.dir}` : null,
      description: options?.descriptionFilter,
      rule: options?.ruleFilter,
      ...filters
    }
  })
  const resp = response.data;

  // cleanup the data returned.
  resp.results.forEach(item => {

    // deserialize the tags
    // item.tags =        (item.tags)        ? JSON.parse(item.tags) : []
    const auto_tags = (item.auto_tags) ? JSON.parse(item.auto_tags) : {}
    item.auto_tags = auto_tags?.tags || []
    item.auto_tags_rule_ids = auto_tags?.rule || []


    item.manual_tags = (item.manual_tags) ? JSON.parse(item.manual_tags) : []

    const auto_party = (item.auto_party) ? JSON.parse(item.auto_party) : {}
    item.auto_party = auto_party?.party || []
    item.auto_party_rule_ids = [auto_party?.rule] || ""

    item.manual_party = (item.manual_party) ? JSON.parse(item.manual_party) : []

    item.tags = [...new Set([...item.manual_tags, ...item.auto_tags])];
    item.party = [...new Set([...item.manual_party, ...item.auto_party])];

    // default the auto_categorize to true
    item.auto_categorize = (item.auto_categorize === 0) ? false : true;
  });

  return resp;
}

/**
 * @param {object} options Query options used to retrieve the query results.
 * @param options.pageIndex 0-index based page index to send through to the API
 * @param options.pageSize Number of items to return per page of query results.
 * @param options.orderBy.field Field used to sort the query results.
 * @param options.orderBy.dir Direction to sort by (asc, desc).
 * @param options.descriptionFilter String value to filter descriptions by.
 * @param options.ruleFilter Custom rule to filter query results.
 * @returns {SWRResponse<any, any, {keepPreviousData: boolean}>}
 */
export function useFetchTransactions(options) {
  return useSWR(['/transactions', options], fetcher, {
    keepPreviousData: true
  });
}

export function useUpdateTransaction() {
  return {
    update: updater
  }
}