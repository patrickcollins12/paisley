import { createFileRoute, redirect } from "@tanstack/react-router"

export function createAuthenticatedFileRoute(path, options) {
  const Route =  createFileRoute(path)({
    ...options,
    beforeLoad: ({ context }) => {
      if (!context.auth.isAuthenticated) {
        throw redirect({
          to: '/login'
        });
      }
    }
  });
  return Route;
}