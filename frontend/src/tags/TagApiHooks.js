import useSWR from "swr";
import httpClient from "@/lib/httpClient.js";

// Adopting the same approach as AccountApiHooks: the baseURL is '/api',
// so do not prefix our endpoint path with '/api'
async function fetcher(url) {
  // e.g., if url is 'tags', final path => '/api/tags'
  const response = await httpClient.get(url);
  return response.data;
}

async function fetcherWithParams([url, params]) {
  // e.g., if url is 'tags', final path => '/api/tags'
  const response = await httpClient.get(url, { params });
  return response.data;
}

// Fetch all tags
export function useFetchTagsNew(types) {
  const { data, error, isLoading, mutate } = useSWR(types, fetcher);

  return {
    data,
    error,
    isLoading,
    mutate
  };
}

export function useFetchTags(tagResource, options = {}) {
  
  if (! ['tags','parties'].includes(tagResource) ) {
    throw new Error(`Invalid resource in useFetchTags: ${tagResource}.`)
  }

  const { expandParents = true } = options;
  const swrKey = expandParents ? tagResource : [tagResource, { expand_parents: 'false' }];
  const swrFetcher = expandParents ? fetcher : fetcherWithParams;

  const { data, error, isLoading, mutate } = useSWR(swrKey, swrFetcher);

  
  return {
    data,
    error,
    isLoading,
    mutate
  }
}

// Rename tag
export function useRenameTag() {
  async function rename(oldName, newName) {
    const payload = { oldName, newName };
    // e.g., final path => '/api/tags/rename'
    const response = await httpClient.patch("tags/rename", payload);
    return response.data;
  }

  return { rename };
}