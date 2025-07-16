import { useState } from "react"
import { useTranslation } from 'react-i18next';
import SearchInput from "@/components/ui/search-input.jsx";

export default function GlobalFilter({ dataTable }) {
  const [value, setValue] = useState('');
  const { t } = useTranslation();

  function handleChange(evt) {
    setValue(evt.target.value);
    dataTable.setGlobalFilter(evt.target.value);
  }

  function handleClear() {
    setValue('');
    dataTable.resetGlobalFilter();
  }

  return (
    <SearchInput
      value={value}
      onChange={handleChange}
      onClear={handleClear}
      placeholder={t("Search...")}
      className="h-8 w-[150px] lg:w-[250px] pr-6"
    />
  )
}