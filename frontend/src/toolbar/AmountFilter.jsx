import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import { useEffect, useState } from "react"
import FilterButton from "@/toolbar/FilterButton.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"
import { Input } from "@/components/ui/input.jsx"
import { CircleDollarSignIcon, NotepadText as DescriptionIcon } from "lucide-react"
import { defaultOperator, filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useDebounce } from "react-use"
import { useSearch } from "@/components/search/SearchContext.jsx"

const fieldList = [
  { id: 'amount', label: 'Amount' },
  { id: 'debit', label: 'Debit' },
  { id: 'credit', label: 'Credit' }
];
const filterRegex = /([0-9]{0,}(?:\.[0-9]{0,2})?)/;

// TODO: Clear between state properly. Right now a second value element is set
// which is never unset when you switch operators or fields.
function AmountFilter({ operators }) {

  const searchContext = useSearch();
  const activeFilters = searchContext.getFilters(...fieldList.map(field => field.id));
  const isFilterActive = activeFilters.length > 0;
  const [field, setField] = useState(() => {
    if (activeFilters.length === 0) return fieldList[0];

    const field = fieldList.find(f => f.id === activeFilters[0].field);
    if (!field) return fieldList[0];

    return field;
  });
  const [value, setValue] = useState(activeFilters.map(f => f.value));
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(() => {
    // if there are no active filters or too many then return the default operator
    if (activeFilters.length === 0 || activeFilters.length > 2) return defaultOperator(operators);

    // if there is one then set the operator to that
    if (activeFilters.length === 1) return activeFilters[0].operatorDefinition.id;

    // if there is two then set the operator to between
    return operators.number_between.id;
  });
  const operatorDef = operators[operator];

  const handleUpdate = () => {
    if (value.length === 0) return;

    if (value.length === 1 && operator !== 'number_between') {
      searchContext.updateFilters(filterExpression(field.id, operatorDef, value[0]));
    } else {
      let filters = [];
      filters.push(filterExpression(field.id, operators.number_abs_gt, value[0]));
      filters.push(filterExpression(field.id, operators.number_abs_lt, value[1]));
      searchContext.updateFilters(...filters);
    }
  }

  useDebounce(handleUpdate, 500, [value]);
  useEffect(handleUpdate, [field, operator]);

  const handleClear = (event) => {
    event.stopPropagation();

    setValue([]);
    setField(fieldList[0]);
    setOperator(defaultOperator(operators));

    searchContext.clearFilters(...fieldList.map(f => f.id));
  };

  const handleFieldChange = (fieldId) => {
    const newField = fieldList.find(field => field.id === fieldId);
    if (!newField) return;
    setField(prevState => {
      searchContext.clearFilters(prevState.id);
      return newField;
    });
  }

  const handleInput = (event, valueIndex) => {
    const matches = filterRegex.exec(event.target.value);
    if (!matches) return;
    setValue(prevState => {
      let newState = [...prevState];
      newState[valueIndex] = matches[0];
      return newState;
    });
  }

  function renderButtonLabel(label) {
    const icon = (<CircleDollarSignIcon className="h-4 w-4 mr-2" />);

    return (
      <>
        <span>{icon}</span>
        <span className="inline-flex gap-1 w-auto text-nowrap">
          <span className="opacity-40">{label}</span>

          {'short' in operatorDef ?
            <span>{operatorDef.short}</span>
            :
            <span>{operatorDef.label}</span>
          }
          <span>{value.join(' to ')}</span>
        </span>
      </>
    )
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div>
          <FilterButton
            isFilterActive={isFilterActive}
            label={field.label}
            onClear={handleClear}
            activeRenderer={renderButtonLabel}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align='start' className="w-auto">
        <div className="text-xs">
          <div className="flex flex-col gap-3 items-start mb-3">
            <Select value={field.id} className="border border-3" onValueChange={handleFieldChange}>
              <SelectTrigger className="border h-8 text-xs w-[225px] inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldList.map(field => (
                  <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={operator} className="border border-3" onValueChange={operatorValue => setOperator(operatorValue)}>
              <SelectTrigger className="border h-8 text-xs w-[225px] inline-flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(operators).map(([value, obj]) => (
                  <SelectItem key={value} value={value}>{obj.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {operator !== 'number_between' &&
              <Input
                placeholder='e.g. 539.50'
                autoFocus
                onChange={event => handleInput(event, 0)}
                value={value[0] ?? ''}
                className="h-8 w-full pr-6"
              />
            }

            {operator === 'number_between' &&
              <div className='flex w-full'>
                <Input
                  placeholder='e.g. 50.0'
                  autoFocus
                  onChange={event => handleInput(event, 0)}
                  value={value[0] ?? ''}
                  className="h-8 pr-6 w-[95px]"
                />
                <div className='leading-8 text-xs mx-1 grow text-center'>and</div>
                <Input
                  placeholder='e.g. 100.0'
                  autoFocus
                  onChange={event => handleInput(event, 1)}
                  value={value[1] ?? ''}
                  className="h-8 pr-6 w-[95px]"
                />
              </div>
            }
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AmountFilter;