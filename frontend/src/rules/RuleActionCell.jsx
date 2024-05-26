import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.jsx"
import { Link } from "@tanstack/react-router"
import { Settings, Eye, MoreHorizontal, Trash } from "lucide-react"

export default function RuleActionCell({ id, onDelete }) {

  function handleDelete() {
    if (confirm('Are you sure you want to delete this rule?')) {
      onDelete(id).catch(error => {
        console.error('Error deleting rule', error);
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end text-muted-foreground hover:cursor-pointer hover:text-foreground">
          <MoreHorizontal size={14} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem className='hover:cursor-pointer' asChild>
          <Link to={`/rules/${id}`}>
            <span className="pr-3"><Settings size={14} /></span>
            Edit Rule
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className='hover:cursor-pointer'>
          <span className="pr-3"><Eye size={14} /></span>
          See Matching Transactions
        </DropdownMenuItem>

        <DropdownMenuItem className='text-red-700 dark:text-red-500 hover:cursor-pointer' onClick={handleDelete}>
          <span className="pr-3"><Trash size={14} /></span>
          Delete Rule
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}