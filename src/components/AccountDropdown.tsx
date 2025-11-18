import Link from 'next/link';
import { Session } from 'next-auth';
import { ChevronDownIcon, UserIcon } from '@heroicons/react/24/outline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface AccountDropdownProps {
  session: Session;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

export default function AccountDropdown({
  session,
  isAdmin,
  signOut,
}: AccountDropdownProps) {
  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="account-dropdown-trigger"
        className="flex items-center space-x-1 p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface transition-colors outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.image || ''} alt={user?.name || ''} />
          <AvatarFallback className="bg-primary text-on-primary text-sm">
            {user?.name?.[0]?.toUpperCase() ||
              user?.email?.[0]?.toUpperCase() || (
                <UserIcon className="w-4 h-4" />
              )}
          </AvatarFallback>
        </Avatar>
        <ChevronDownIcon className="w-4 h-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56"
        data-testid="account-dropdown-menu"
      >
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center space-x-2 w-full">
            <UserIcon className="w-4 h-4" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/nutrition"
            className="flex items-center space-x-2 w-full"
          >
            <span className="w-4 h-4 text-center">📊</span>
            <span>Nutrition</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/household"
            className="flex items-center space-x-2 w-full"
          >
            <span className="w-4 h-4 text-center">🏠</span>
            <span>Household</span>
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="flex items-center space-x-2 w-full text-primary"
            >
              <span className="w-4 h-4 text-center">⚙️</span>
              <span>Admin</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <form action={signOut} className="w-full">
            <Button
              type="submit"
              variant="tertiary"
              className="flex items-center space-x-2 w-full text-left justify-start p-0 h-auto"
            >
              <span className="w-4 h-4 text-center">↗</span>
              <span>Sign out</span>
            </Button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
