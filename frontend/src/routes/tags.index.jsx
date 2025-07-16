import { createAuthenticatedFileRoute } from "@/auth/RouteHelpers.jsx";
import TagsPage from "@/tags/TagsPage.jsx";
import { z } from "zod";

const tagsSearchSchema = z.object({
  filter: z.string().optional().default(""),
});

export const Route = createAuthenticatedFileRoute("/tags/", {
  component: TagsPage,
  validateSearch: (search) => tagsSearchSchema.parse(search),
});