import { AccountDisplay } from '@/transactions/AccountDisplay.jsx';
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import { EditableDescriptionCell } from '@/transactions/EditableDescriptionCell.jsx';
import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import { Currency } from "@/components/CurrencyDisplay.jsx"
import { TransactionTagsDisplay } from "@/transactions/TransactionTagsDisplay.jsx"
import AccountIcon from '@/icons/AccountIcon.jsx';
import TagsCellContent from './TagsCellContent.jsx';

export function createColumnDefinitions(onTransactionUpdate, t, onQuickRuleClick) {

  return [
    {
      accessorKey: 'id',
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => {
        let id = row.getValue("id");
        return id.substr(0, 4) + ".." + id.substr(id.length - 4, 4)
      },
      size: 70,
      meta: {
        displayName: t("ID")
      }
    },

    {
      accessorKey: 'datetime',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <DateTimeDisplay account={row.getValue("account_number")} datetime={row.getValue("datetime")} />,
      size: 150,
      meta: {
        displayName: t("Date")
      }
    },

    {
      accessorKey: 'account_number',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_number")} />,
      size: 120,
      meta: {
        displayName: t("Account Number")
      }
    },

    {
      accessorKey: 'account_shortname',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_shortname")} />,
      size: 200,
      enableResizing: true,
      meta: { displayName: t("Account") }
    },

    {
      accessorKey: 'account_currency',
      size: 80,
      meta: { displayName: t("Account Currency") }

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
      size: 300,
      enableResizing: true,
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
      size: 100,
      meta: {
        displayName: t("Debit")
      }
    },

    {
      accessorKey: 'credit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency className="text-right whitespace-nowrap">{table.options.resultsSummary?.credit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("credit")}</Currency>,
      size: 100,
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
      size: 100,
      meta: {
        displayName: t("Amount")
      }
    },

    {
      accessorKey: 'balance',
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">
        {row.getValue("balance")}
      </Currency>,
      size: 120,
      meta: {
        displayName: t("Balance")
      }
    },

    {
      accessorKey: 'tags',
      header: props => <HeaderCell align='left' {...props} />,
      enableResizing: true,
      cell: props => <TagsCellContent
                      row={props.row}
                      onTransactionUpdate={onTransactionUpdate}
                      onQuickRuleClick={onQuickRuleClick}
                    />,
      size: 250,
      meta: {
        displayName: t("Tags")
      }
    },

    {
      accessorKey: 'party',
      header: props => <HeaderCell align='left' {...props} />,
      enableResizing: true,
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
      size: 250,
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