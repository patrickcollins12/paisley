import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx"
import React, { useEffect, useState } from "react"
import FilterButton from "@/toolbar/FilterButton.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx"
import { Input } from "@/components/ui/input.jsx"
import { CircleDollarSignIcon, NotepadText as DescriptionIcon } from "lucide-react"
import { defaultOperator, filterExpression } from "@/toolbar/FilterExpression.jsx"
import { useDebounce } from "react-use"

const fieldList = [
  { id: 'amount', label: 'Amount' },
  { id: 'debit', label: 'Debit' },
  { id: 'credit', label: 'Credit' }
];
const filterRegex = /([0-9]{0,}(?:\.[0-9]{0,2})?)/;

function AmountFilter({ operators, onFilterUpdate, onFilterClear }) {

  const [field, setField] = useState(fieldList[0]);
  const [value, setValue] = useState([]);
  const [debouncedValue, setDebouncedValue] = useState([]);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [operator, setOperator] = useState(defaultOperator(operators));
  const operatorDef = operators[operator];

  useDebounce(() => {
    setDebouncedValue(value);
  }, 500, [value]);

  useEffect(() => {
    if (debouncedValue.length === 0) return;

    setIsFilterActive(true);
    if (debouncedValue.length === 1 && operator !== 'between') {
      onFilterUpdate(filterExpression(field.id, operatorDef, debouncedValue[0]));
    } else {
      let filters = [];
      filters.push(filterExpression(field.id, operators.abs_gt, debouncedValue[0]));
      filters.push(filterExpression(field.id, operators.abs_lt, debouncedValue[1]));
      onFilterUpdate(...filters);
    }
  }, [debouncedValue, field, operator]);

  const handleClear = (event) => {
    event.stopPropagation();

    setValue([]);
    setDebouncedValue([]);
    setIsFilterActive(false);
    setField(fieldList[0]);
    setOperator(defaultOperator(operators));
    onFilterClear(field.id);
  };

  const handleFieldChange = (fieldId) => {
    const newField = fieldList.find(field => field.id === fieldId);
    if (!newField) return;
    setField(prevState => {
      onFilterClear(prevState.id);
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

            {operator !== 'between' &&
              <Input
                placeholder='e.g. 539.50'
                autoFocus
                onChange={event => handleInput(event, 0)}
                value={value[0] ?? ''}
                className="h-8 w-full pr-6"
              />
            }

            {operator === 'between' &&
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