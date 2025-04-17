import HeaderCell from "@/components/data-table/HeaderCell.jsx"
import InlineEditCell from "@/components/data-table/InlineEditCell.jsx"
import RuleActionCell from "@/rules/RuleActionCell.jsx"
import { RulesTagsDisplay } from "@/rules/RulesTagsDisplay.jsx"

export function createColumnDefinitions(updaterFunc, removeFunc) {
  return [
    {
      accessorKey: 'id',
      header: props => <HeaderCell {...props} />,
      size: 60,
      meta: {
        displayName: 'Rule ID'
      }
    },
    {
      accessorKey: 'rule',
      header: props => <HeaderCell {...props} />,
      size: 500,
      enableResizing: true,
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
    {
      accessorKey: 'tag',
      header: props => <HeaderCell {...props} />,
      cell: props => <RulesTagsDisplay resource="tags" id={props.row.original.id} onUpdate={updaterFunc} values={props.row.original.tag} isMulti={true}/>,
      size: 400,
      enableResizing: true,
      meta: {
        displayName: 'Tags'
      }
    },
    {
      accessorKey: 'party',
      header: props => <HeaderCell {...props} />,
      cell: props => <RulesTagsDisplay resource="parties" id={props.row.original.id} onUpdate={updaterFunc} values={props.row.original.party} isMulti={false} />,
      size: 200,
      enableResizing: true,
      meta: {
        displayName: 'Party'
      }
    },
    {
      accessorKey: 'tx_count',
      header: props => <HeaderCell {...props} />,
      size: 80,
      meta: {
        displayName: 'Matches'
      }
    },
    {
      accessorKey: 'comment',
      header: props => <HeaderCell {...props} />,
      size: 300,
      enableResizing: true,
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
      size: 80,
      cell: ({ row }) => <RuleActionCell id={row.original.id} onDelete={removeFunc} />
    }
  ];
}