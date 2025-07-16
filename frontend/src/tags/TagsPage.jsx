import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useFetchTags, useRenameTag } from "./TagApiHooks.js";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast.js";
import { getRouteApi } from "@tanstack/react-router";
import SearchInput from "@/components/ui/search-input.jsx";

const routeApi = getRouteApi('/tags/');

/**
 * Displays an alphabetical list of tags. Clicking a tag goes into inline edit mode.
 * The user can rename it. On submit, calls /api/tags/rename (or similar).
 */
export default function TagsPage() {
  const { t } = useTranslation();
  const { data: allTags, error, isLoading } = useFetchTags("tags", { expandParents: false });
  const { rename } = useRenameTag();
  const { toast } = useToast();
  const navigate = routeApi.useNavigate();
  const urlSearchParams = routeApi.useSearch();
  const [tagList, setTagList] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  const [editValue, setEditValue] = useState("");
  const filterInputRef = useRef(null);

  // Use URL search params for filter text
  const filterText = urlSearchParams.filter || "";

  // Focus the filter input when the page loads
  useEffect(() => {
    if (filterInputRef.current) {
      filterInputRef.current.focus();
    }
  }, []);

  const handleFilterChange = useCallback((evt) => {
    navigate({
      search: { filter: evt.target.value }
    });
  }, [navigate]);

  const handleFilterClear = useCallback(() => {
    navigate({
      search: { filter: "" }
    });
  }, [navigate]);

  useEffect(() => {
    if (allTags && Array.isArray(allTags)) {
      setTagList([...allTags].sort());
    }
  }, [allTags]);

  const handleStartEdit = useCallback((tag) => {
    setEditingTag(tag);
    setEditValue(tag);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingTag(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingTag) return;
    const oldName = editingTag;
    const newName = editValue.trim();

    if (!newName || newName === oldName) {
      setEditingTag(null);
      return;
    }

    try {
      const result = await rename(oldName, newName);
      
      if (result.success) {
        setTagList((prevList) =>
          prevList.map((t) => (t === oldName ? newName : t)).sort()
        );
        
        // Show success toast with details
        const messages = [];
        if (result.transactions > 0) {
          messages.push(`${result.transactions} transaction${result.transactions === 1 ? '' : 's'} changed`);
        }
        if (result.rules > 0) {
          messages.push(`${result.rules} rule${result.rules === 1 ? '' : 's'} changed`);
        }
        
        if (result.errors > 0) {
          toast({
            description: `Tag renamed but with errors: ${result.errors}`,
            duration: 3000,
            variant: "destructive"
          });
        } else if (messages.length > 0) {
          toast({
            description: messages.join('. '),
            duration: 2000
          });
        } else {
          toast({
            description: "No transactions or rules changed.",
            duration: 2000
          });
        }
      } else {
        toast({
          description: result.error || "Failed to rename tag",
          duration: 3000,
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Rename failed:", err);
      toast({
        description: "Failed to rename tag",
        duration: 3000,
        variant: "destructive"
      });
    } finally {
      setEditingTag(null);
    }
  }, [editingTag, editValue, rename, toast]);

  const filteredTags = useMemo(
    () =>
      tagList.filter((tag) =>
        tag.toLowerCase().includes(filterText.toLowerCase())
      ),
    [tagList, filterText]
  );

  if (isLoading) return <div>{t("Loading...")}</div>;
  if (error) return <div className="text-red-600">{t("Error fetching tags")}</div>;

  return (
    <div className="flex flex-col items-center justify-center p-0">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="mb-4">{t("Tags")}</CardTitle>
          <SearchInput
            ref={filterInputRef}
            value={filterText}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
            placeholder={t("Filter...")}
            className=""
            clearThreshold={0}
          />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {filteredTags.map((tag) => {
              if (editingTag === tag) {
                return (
                  <li key={tag} className="space-y-2">
                    <SearchInput
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClear={handleCancelEdit}
                      onSubmit={handleSave}
                      placeholder={t("Enter tag name...")}
                      className="w-full"
                    />
                  </li>
                );
              }
              return (
                <li
                  key={tag}
                  className="hover:cursor-pointer"
                  onClick={() => handleStartEdit(tag)}
                >
                  <Badge variant="colored">{tag}</Badge>
                </li>
              );
            })}
            {filteredTags.length === 0 && (
              <li className="text-sm text-muted-foreground">
                {t("No tags found")}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}