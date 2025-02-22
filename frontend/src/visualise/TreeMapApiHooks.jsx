import useSWR from "swr";
import httpClient from "@/lib/httpClient.js"

async function fetcher([url, options]) {
  // console.log('fetcher', options);

  const filters = options.filters?.reduce((accumulator, filter) => {
    const filterKey = `filter[${filter.field}][${filter.operatorDefinition.operator}]`;
    const filterValue = filter.operatorDefinition.getValue?.(filter) ?? filter.value;
    accumulator[filterKey] = filter.operatorDefinition.operatorOnly ? '' : filterValue;
    return accumulator;
  }, {});

  console.log("filters>", filters)
  
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
export function useFetchTreeMap(options) {
  console.log("options>", options)
  return useSWR(['/transaction_treemap', options], fetcher, {
    keepPreviousData: true
  });
}
