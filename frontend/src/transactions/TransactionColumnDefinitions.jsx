import { AccountDisplay } from '@/transactions/AccountDisplay.jsx';
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import { EditableDescriptionCell } from '@/transactions/EditableDescriptionCell.jsx';
import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import { TransactionTagsDisplay } from "@/transactions/TransactionTagsDisplay.jsx"
import { Currency } from "@/components/CurrencyDisplay.jsx"

export function createColumnDefinitions(onTransactionUpdate) {
  return [
    {
      accessorKey: 'id',
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => {
        let id = row.getValue("id");
        return id.substr(0, 4) + ".." + id.substr(id.length - 4, 4)
      },
      meta: {
        displayName: 'ID'
      }
    },

    {
      accessorKey: 'datetime',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <DateTimeDisplay account={row.getValue("account_number")} datetime={row.getValue("datetime")} />,
      meta: {
        displayName: 'Date'
      }
    },

    {
      accessorKey: 'account_number',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_number")} />,
      meta: {
        displayName: 'Account Number'
      }
    },

    {
      accessorKey: 'account_shortname',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_shortname")} />,
      meta: {
        displayName: 'Account'
      }
    },

    {
      accessorKey: 'account_currency',
    },

    // {
    //   accessorKey: 'account_currency',
    //   header: props => <HeaderCell {...props} />,
    //   cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_shortname")} />,
    //   meta: {
    //     displayName: 'Account'
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
        displayName: 'Description'
      }
    },

    //{ currency: "EUR", locale:"de-DE", zeroIsBlank: true, blankIsZero: false }
    {
      accessorKey: 'debit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency>{table.options.resultsSummary?.debit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("debit")}</Currency>,
      meta: {
        displayName: 'Debit'
      }
    },

    {
      accessorKey: 'credit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency className="text-right whitespace-nowrap">{table.options.resultsSummary?.credit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("credit")}</Currency>,
      meta: {
        displayName: 'Credit'
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
        displayName: 'Amount'
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
        displayName: 'Balance'
      }
    },

    {
      accessorKey: 'tags',
      header: props => <HeaderCell align='left' {...props} />,
      enableResizing: true,
      // width: 500,
      cell: props => <TransactionTagsDisplay
        type="tags"
        updateHandler={onTransactionUpdate}
        manual={props.row.original.manual_tags}
        auto={props.row.original.auto_tags}
        full={props.row.original.tags}
        rules={props.row.original.auto_tags_rule_ids}
        data={props.row.original}
        placeholder="Add tags..."
        isMulti={true}
        autoFocus={true}
        isClearable={true}
        maxMenuHeight={200}
        openMenuOnFocus={true}
      />,
      meta: {
        displayName: 'Tags'
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
        displayName: 'Party'
      }
    }

  ];
}