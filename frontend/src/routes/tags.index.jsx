import { createAuthenticatedFileRoute } from "@/auth/RouteHelpers.jsx";
import TagsPage from "@/tags/TagsPage.jsx";

export const Route = createAuthenticatedFileRoute("/tags/", {
  component: TagsPage,
});