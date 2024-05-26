import useSWR from "swr"

import httpClient from "@/lib/httpClient.js"

async function fetcher(url) {
  const response = await httpClient.get(url);
  return response.data;
}

// tagResource = parties or tags
// calls /parties or /rules
export function useFetchTags(tagResource) {
  
  if (! ['tags','parties'].includes(tagResource) ) {
    throw new Error(`Invalid resource in useFetchTags: ${tagResource}.`)
  }

  const { data, error, isLoading } = useSWR(tagResource, fetcher);

  return {
    data,
    error,
    isLoading
  }
}