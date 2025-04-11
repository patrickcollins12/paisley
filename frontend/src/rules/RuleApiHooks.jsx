import useSWR, { mutate } from "swr"
import httpClient from "@/lib/httpClient.js"
import { cache } from "swr/_internal"

async function rulesFetcher([url]) {
  // console.log('fetcher', query);
  const response = await httpClient.get(url);
  response.data.forEach(item => {
    item.tag = (item.tag) ? JSON.parse(item.tag) : []
    item.party = (item.party) ? JSON.parse(item.party) : []

  });

  return response.data;
}

async function ruleFetcher([url, id]) {
  const response = await httpClient.get(`${url}/${id}`);
  const rule = response.data
  rule.tag = JSON.parse(rule.tag) || []
  rule.party = JSON.parse(rule.party) || []
  return rule;
}

async function update(id, data) {
  const url = `rule/${id}`;
  const response = await httpClient.patch(url, data);
  await mutate(['/rules']);
  return response;
}

async function create(postData) {
  try {
    const response = await httpClient.post('rule', postData);
    
    // Mutate the rules cache to refresh the rules list
    await mutate(['/rules']);
    
    // Mutate all transaction-related caches to refresh transaction data
    // This will ensure that any components using transaction data will be updated
    for (const key of cache.keys()) {
      if (key.includes('/transactions')) {
        await mutate(key);
      }
    }
    
    return { data: response.data, error: null, isLoading: false };
  } catch (err) {
    const errorMsg = err.response?.data?.errors?.[0]?.msg || err.message;
    return { data: null, error: errorMsg, isLoading: false };
  }
}


// async function createOLD(postData) {
//   return await httpClient.post('url', postData);
// }

async function remove(id) {
  const url = `rule/${id}`;
  const response = await httpClient.delete(url);

  // this is a bit shit because the query key has to be updated in multiple places
  await mutate(['/rules']);
  return response;
}

export function useUpdateRules() {
  return {
    create,
    update,
    remove
  }
}

export function useFetchRules() {
  return useSWR(['/rules'], rulesFetcher);
}

/**
 * Fetches data for a single rule.
 * @param id - Rule ID or NULL (if null then no data is fetched)
 * @returns {SWRResponse<any, any>}
 */
export function useFetchRule(id) {
  return useSWR(id ? ['/rule', id] : null, ruleFetcher);
}