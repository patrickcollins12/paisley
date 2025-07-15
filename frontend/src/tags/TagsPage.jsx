import React, { useEffect, useState } from "react";
import { useFetchTags, useRenameTag } from "./TagApiHooks.js";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Displays an alphabetical list of tags. Clicking a tag goes into inline edit mode.
 * The user can rename it. On submit, calls /api/tags/rename (or similar).
 */

export default function TagsPage() {
  const { t } = useTranslation();
  const { data: allTags, error, isLoading } = useFetchTags("tags");
  const { rename } = useRenameTag();
  const [tagList, setTagList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    if (allTags && Array.isArray(allTags)) {
      setTagList(allTags);
    }
  }, [allTags]);

  function handleStartEdit(index) {
    setEditIndex(index);
    setEditValue(tagList[index]);
  }

  async function handleSave(index) {
    const oldName = tagList[index];
    const newName = editValue.trim();
    if (!newName || newName === oldName) {
      setEditIndex(null);
      return;
    }
    try {
      await rename(oldName, newName);
      const newList = [...tagList];
      newList[index] = newName;
      setTagList(newList);
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setEditIndex(null);
    }
  }

  function renderTagRow(tag, index) {
    if (editIndex === index) {
      return (
        <li key={index} className="flex items-center gap-2">
          <Input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave(index);
            }}
            className="max-w-sm"
          />
          <Button onClick={() => handleSave(index)}>
            {t("Save")}
          </Button>
          <Button variant="secondary" onClick={() => setEditIndex(null)}>
            {t("Cancel")}
          </Button>
        </li>
      );
    } else {
      return (
        <li
          key={index}
          className="hover:cursor-pointer"
          onClick={() => handleStartEdit(index)}
        >
          <Badge variant="colored">{tag}</Badge>
        </li>
      );
    }
  }

  if (isLoading) return <div>{t("Loading...")}</div>;
  if (error) return <div className="text-red-600">{t("Error fetching tags")}</div>;

  const filteredTags = tagList.filter(tag => tag.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <div className="flex flex-col items-center justify-center p-0">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t("Tags")}</CardTitle>
           <Input
            type="text"
            placeholder="Filter..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {filteredTags?.map((tag, idx) => (
              <React.Fragment key={idx}>
                {renderTagRow(tag, idx)}
              </React.Fragment>
            ))}
            {filteredTags?.length === 0 && (
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