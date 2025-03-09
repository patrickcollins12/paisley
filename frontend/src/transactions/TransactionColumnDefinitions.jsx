import { AccountDisplay } from '@/transactions/AccountDisplay.jsx';
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import { EditableDescriptionCell } from '@/transactions/EditableDescriptionCell.jsx';
import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import { TransactionTagsDisplay } from "@/transactions/TransactionTagsDisplay.jsx"
import { formatAmountCell } from "@/transactions/TransactionFieldFormatters.jsx"
import { formatCurrency, formatDate } from "@/lib/localisation_utils.js";

export function createColumnDefinitions(onTransactionUpdate) {
  return [
    {
      accessorKey: 'id',
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => { 
        let id = row.getValue("id"); 
        return id.substr(0,4) + ".." + id.substr(id.length-4,4) 
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

    {
      accessorKey: 'debit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => formatAmountCell(table.options.resultsSummary?.debit_total ?? 0.0),
      cell: ({ row }) => formatAmountCell(row.getValue("debit")),
      meta: {
        displayName: 'Debit'
      }
    },

    {
      accessorKey: 'credit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => formatAmountCell(table.options.resultsSummary?.credit_total ?? 0.0),
      cell: ({ row }) => formatAmountCell(row.getValue("credit")),
      meta: {
        displayName: 'Credit'
      }
    },

    {
      accessorKey: 'amount',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => formatAmountCell(table.options.resultsSummary?.amount_total ?? 0.0),
      cell: ({ row }) => {
        const amt = row.getValue("amount")

        return amt === 0 ? (
          <></>
        ) : (
          <div className={amt > 0 ? "text-green-500 text-right" : "text-right"}>
            {amt > 0 ? `(${formatCurrency(amt)})` : formatCurrency(Math.abs(amt))}
          </div>
        );

      },
      meta: {
        displayName: 'Amount'
      }
    },

    {
      accessorKey: 'balance',
      // header: () => <div className="text-right">Balance</div>,
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => formatAmountCell(row.getValue("balance")),
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
        rules= {props.row.original.auto_tags_rule_ids}
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
        rules= {props.row.original.auto_party_rule_ids}
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