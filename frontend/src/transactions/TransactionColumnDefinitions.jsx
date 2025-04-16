import { AccountDisplay } from '@/transactions/AccountDisplay.jsx';
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import { EditableDescriptionCell } from '@/transactions/EditableDescriptionCell.jsx';
import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import { TransactionTagsDisplay } from "@/transactions/TransactionTagsDisplay.jsx"
import { Currency } from "@/components/CurrencyDisplay.jsx"
import { Button } from "@/components/ui/button.jsx"
import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";

export function createColumnDefinitions(onTransactionUpdate, t, onQuickRuleClick) {

  return [
    {
      accessorKey: 'id',
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => {
        let id = row.getValue("id");
        return id.substr(0, 4) + ".." + id.substr(id.length - 4, 4)
      },
      meta: {
        displayName: t("ID")
      }
    },

    {
      accessorKey: 'datetime',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <DateTimeDisplay account={row.getValue("account_number")} datetime={row.getValue("datetime")} />,
      meta: {
        displayName: t("Date")
      }
    },

    {
      accessorKey: 'account_number',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_number")} />,
      meta: {
        displayName: t("Account Number")
      }
    },

    {
      accessorKey: 'account_shortname',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_shortname")} />,
      meta: {
        displayName: t("Account")
      }
    },

    {
      accessorKey: 'account_currency',
      meta: {
        displayName: t("Account Currency")
      }

    },

    // {
    //   accessorKey: 'account_currency',
    //   header: props => <HeaderCell {...props} />,
    //   cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_shortname")} />,
    //   meta: {
    //     displayName: t("Account")
    //   }
    // },

    {
      accessorKey: 'description',
      header: props => <HeaderCell {...props} />,
      width: 300,
      cell: ({ row, column: { id }, table }) => (
        <EditableDescriptionCell key={row.original.id} row={row} columnId={id} table={table} />
      ),
      meta: {
        displayName: t("Description")
      }
    },

    //{ currency: "EUR", locale:"de-DE", zeroIsBlank: true, blankIsZero: false }
    {
      accessorKey: 'debit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency>{table.options.resultsSummary?.debit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("debit")}</Currency>,
      meta: {
        displayName: t("Debit")
      }
    },

    {
      accessorKey: 'credit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency className="text-right whitespace-nowrap">{table.options.resultsSummary?.credit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("credit")}</Currency>,
      meta: {
        displayName: t("Credit")
      }
    },

    {
      accessorKey: 'amount',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency className="text-right whitespace-nowrap">{table.options.resultsSummary?.amount_total}</Currency>,
      cell: ({ row }) => {
        const amt = -row.getValue("amount")
        return (
          <Currency style="currency" currency={row.getValue("account_currency")} zeroIsBlank={true} className={amt <= 0 ? "text-green-500 text-right" : "text-right"} currencySign="accounting">
            {amt}
          </Currency>
        )
      },
      meta: {
        displayName: t("Amount")
      }
    },

    {
      accessorKey: 'balance',
      // header: () => <div className="text-right">Balance</div>,
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">
        {row.getValue("balance")}
      </Currency>,
      meta: {
        displayName: t("Balance")
      }
    },

    {
      accessorKey: 'tags',
      header: props => <HeaderCell align='left' {...props} />,
      enableResizing: true,
      // width: 500,
      cell: props => {
        const { row } = props;
        const description = row.original.description;
        const autoTags = row.original.auto_tags;

        return (
          <div className="flex items-center gap-1">

            {/* Tag editor */}
            <div className="flex-grow">
              <TransactionTagsDisplay
                type="tags"
                updateHandler={onTransactionUpdate}
                manual={row.original.manual_tags}
                auto={row.original.auto_tags}
                full={row.original.tags}
                rules={row.original.auto_tags_rule_ids}
                data={row.original}
                placeholder="Add tags..."
                isMulti={true}
                autoFocus={false}
                isClearable={true}
                maxMenuHeight={200}
                openMenuOnFocus={false}
              />
            </div>

            {/* Quick rule button next to tag editor */}
            {(!autoTags || autoTags.length === 0) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="invisible group-hover:visible h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickRuleClick?.(description);
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick rule</p>
                </TooltipContent>
              </Tooltip>


            )}
          </div>
        );
      },
      meta: {
        displayName: t("Tags")
      }
    },

    // placeholder
    // isClearable={true}
    // maxMenuHeight={200}
    // // autoFocus={true}
    // openMenuOnFocus={true} 
    // isDisabled="true"
    // autoFocus={true}
    // openMenuOnFocus={true}
    // placeholder={inputPlaceholder || "Add a tag..."}
    // maxMenuHeight={200}

    {
      accessorKey: 'party',
      header: props => <HeaderCell align='left' {...props} />,
      enableResizing: true,
      width: 300,
      cell: props => <TransactionTagsDisplay
        type="parties"
        updateHandler={onTransactionUpdate}
        manual={props.row.original.manual_party}
        auto={props.row.original.auto_party}
        full={props.row.original.party}
        rules={props.row.original.auto_party_rule_ids}
        data={props.row.original}
        placeholder="Add a party..."
        isMulti={false}
        autoFocus={true}
        isClearable={true}
        maxMenuHeight={200}
        openMenuOnFocus={true}
      />,
      meta: {
        displayName: t("Party")
      }
    },

    // Actions column with Quick Rule button
    // {
    //   id: 'actions',
    //   header: props => <HeaderCell align='center' {...props} />,
    //   cell: ({ row }) => {
    //     const description = row.original.description;
    //     return (
    //       <div className="flex justify-center">
    //         <Button
    //           variant="outline"
    //           size="sm"
    //           className="invisible group-hover:visible"
    //           onClick={() => onQuickRuleClick?.(description)}
    //           title="Create a rule based on this description"
    //         >
    //           Quick Rule
    //         </Button>
    //       </div>
    //     );
    //   },
    //   meta: {
    //     displayName: t("Actions")
    //   }
    // }
  ];
}