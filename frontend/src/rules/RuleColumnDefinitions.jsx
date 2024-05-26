import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import InlineEditCell from "@/components/data-table/InlineEditCell.jsx"
import RuleActionCell from "@/rules/RuleActionCell.jsx"
import { RulesTagsDisplay } from "@/rules/RulesTagsDisplay.jsx"

export function createColumnDefinitions(updaterFunc, removeFunc) {
  return [
    {
      accessorKey: 'id',
      header: props => <HeaderCell {...props} />,
      meta: {
        displayName: 'Rule ID'
      }
    },
    {
      accessorKey: 'rule',
      header: props => <HeaderCell {...props} />,
      width: 400,
      cell: ({ row }) => <InlineEditCell
        key={row.original.id}
        id={row.original.id}
        name="rule"
        value={row.original.rule}
        onUpdate={updaterFunc} />,
      meta: {
        displayName: 'Rule'
      }
    },
    // {
    //   accessorKey: 'group',
    //   header: props => <HeaderCell {...props} />,
    //   cell: ({ row }) => <InlineEditCell
    //     key={row.original.id}
    //     id={row.original.id}
    //     name="group"
    //     value={row.original.group}
    //     onUpdate={updaterFunc} />,
    //   meta: {
    //     displayName: 'Group'
    //   }
    // },
    {
      accessorKey: 'tag',
      header: props => <HeaderCell {...props} />,
      cell: props => <RulesTagsDisplay resource="tags" id={props.row.original.id} onUpdate={updaterFunc} values={props.row.original.tag} />,
      meta: {
        displayName: 'Tags'
      }
    },
    {
      accessorKey: 'party',
      header: props => <HeaderCell {...props} />,
      cell: props => <RulesTagsDisplay resource="parties" id={props.row.original.id} onUpdate={updaterFunc} values={props.row.original.party} />,
      meta: {
        displayName: 'Party'
      }
    },
    {
      accessorKey: 'matching_transactions',
      header: props => <HeaderCell {...props} />,
      meta: {
        displayName: 'Matched Transactions'
      }
    },
    {
      accessorKey: 'comment',
      header: props => <HeaderCell {...props} />,
      cell: ({ row }) => <InlineEditCell
        key={row.original.id}
        id={row.original.id}
        name="comment"
        value={row.original.comment}
        onUpdate={updaterFunc} />,
      meta: {
        displayName: 'Comments'
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => <RuleActionCell id={row.original.id} onDelete={removeFunc} />
    }
  ];
}