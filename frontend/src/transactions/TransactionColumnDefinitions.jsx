import { AccountDisplay } from '@/transactions/AccountDisplay.jsx';
import { DateTimeDisplay } from '@/transactions/DateTimeDisplay.jsx';
import { EditableDescriptionCell } from '@/transactions/EditableDescriptionCell.jsx';
import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import { Currency } from "@/components/CurrencyDisplay.jsx"
import { TransactionTagsDisplay } from "@/transactions/TransactionTagsDisplay.jsx"
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
      size: 100,
      meta: { displayName: t("ID") }
    },

    {
      accessorKey: 'datetime',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <DateTimeDisplay datetime={row.getValue("datetime")} />,
      size: 100,
      meta: { displayName: t("Date") }
    },

    {
      accessorKey: 'account_number',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <span>{row.getValue("account_number")}</span>,
      size: 200,
      meta: { displayName: t("Account Number") }
    },

    {
      accessorKey: 'account_shortname',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <AccountDisplay account={row.getValue("account_number")} display={row.getValue("account_shortname")} />,
      size: 200,
      meta: { displayName: t("Account") }
    },

    {
      accessorKey: 'account_currency',
      size: 80,
      meta: { displayName: t("Account Currency") }
    },

    {
      accessorKey: 'description',
      header: props => <HeaderCell {...props} />,
      size: 400,
      cell: ({ row, column: { id }, table }) => (
        <EditableDescriptionCell key={row.original.id} row={row} columnId={id} table={table} />
      ),
      meta: { displayName: t("Description") }
    },

    //{ currency: "EUR", locale:"de-DE", zeroIsBlank: true, blankIsZero: false }
    {
      accessorKey: 'debit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency>{table.options.resultsSummary?.debit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("debit")}</Currency>,
      size: 120,
      meta: { displayName: t("Debit") }
    },

    {
      accessorKey: 'credit',
      header: props => <HeaderCell align='right' {...props} />,
      footer: ({ table }) => <Currency className="text-right whitespace-nowrap">{table.options.resultsSummary?.credit_total}</Currency>,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">{row.getValue("credit")}</Currency>,
      size: 120,
      meta: { displayName: t("Credit") }
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
      size: 120,
      meta: { displayName: t("Amount") }
    },

    {
      accessorKey: 'balance',
      header: props => <HeaderCell align='right' {...props} />,
      cell: ({ row }) => <Currency currency={row.getValue("account_currency")} className="text-right whitespace-nowrap">
        {row.getValue("balance")}
      </Currency>,
      size: 120,
      meta: { displayName: t("Balance") }
    },

    {
      accessorKey: 'tags',
      header: props => <HeaderCell align='left' {...props} />,
      cell: props => <TagsCellContent
        row={props.row}
        onTransactionUpdate={onTransactionUpdate}
        onQuickRuleClick={onQuickRuleClick}
      />,
      size: 350,
      meta: { displayName: t("Tags") }
    },

    {
      accessorKey: 'party',
      header: props => <HeaderCell align='left' {...props} />,
      size: 200,
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
      meta: { displayName: t("Party") }
    },

  ];
}