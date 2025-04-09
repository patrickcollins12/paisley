import useSWR from "swr";
import httpClient from "@/lib/httpClient.js";

// Adopting the same approach as AccountApiHooks: the baseURL is '/api',
// so do not prefix our endpoint path with '/api'
async function fetcher(url) {
  // e.g., if url is 'tags', final path => '/api/tags'
  const response = await httpClient.get(url);
  return response.data;
}

// Fetch all tags
export function useFetchTags() {
  const { data, error, isLoading, mutate } = useSWR("tags", fetcher);

  return {
    data: data?.tags,
    error,
    isLoading,
    mutate
  };
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