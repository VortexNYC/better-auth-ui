import type { ReactElement } from "react";
import { DropdownMenu } from "@cloudflare/kumo/components/dropdown";
import { Sidebar, useSidebar } from "@cloudflare/kumo/components/sidebar";
import {
  Buildings,
  CaretUpDown,
  Plus,
  SignOut,
  User,
} from "@phosphor-icons/react";

export interface WorkspaceMenuItem {
  id?: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface WorkspaceMenuUser {
  name: string;
  email: string;
  avatar?: string;
  initials?: string;
}

export interface WorkspaceAccountMenuProps {
  teams: readonly WorkspaceMenuItem[];
  activeSlug?: string;
  user: WorkspaceMenuUser;
  workspaceLabel?: string;
  onTeamSelect?: (slug: string) => void;
  onCreateOrganization?: () => void;
  onOpenProfile?: () => void;
  onSignOut?: () => Promise<void> | void;
}

function Mark({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}): ReactElement {
  const initial = name.trim().charAt(0).toUpperCase() || "W";
  if (logoUrl) {
    return (
      <img src={logoUrl} alt="" className="size-full rounded-md object-cover" />
    );
  }
  return (
    <span
      className="text-xs grid size-full place-items-center rounded-md font-semibold uppercase"
      aria-hidden
    >
      {initial}
    </span>
  );
}

/**
 * Sidebar footer: switch workspace, open the account, sign out.
 * The host navigates after a switch so the current path can stay.
 */
export function WorkspaceAccountMenu({
  teams,
  activeSlug,
  user,
  workspaceLabel = "Workspace",
  onTeamSelect,
  onCreateOrganization,
  onOpenProfile,
  onSignOut,
}: WorkspaceAccountMenuProps): ReactElement {
  const { isMobile } = useSidebar();
  const active =
    teams.find((team) => team.slug === activeSlug) ?? teams[0] ?? null;
  const initials =
    user.initials ??
    user.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenu.Trigger>
            <Sidebar.MenuButton
              size="base"
              className="group"
              aria-label={`${workspaceLabel} ${active?.name ?? workspaceLabel} — ${user.name}`}
            >
              <div className="bg-sidebar-accent text-sidebar-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                {active ? (
                  <Mark name={active.name} logoUrl={active.logoUrl} />
                ) : (
                  <Buildings className="size-4" />
                )}
              </div>
              <div className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="text-sidebar-foreground truncate text-sm font-medium">
                  {active?.name ?? workspaceLabel}
                </span>
                <span className="text-kumo-secondary truncate text-xs">
                  {user.email}
                </span>
              </div>
              <CaretUpDown className="text-kumo-secondary ml-auto size-4 shrink-0" />
            </Sidebar.MenuButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className="min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "top"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Group>
              <DropdownMenu.Label>Switch workspace</DropdownMenu.Label>
              {teams.map((team) => {
                const isActive = team.slug === active?.slug;
                return (
                  <DropdownMenu.Item
                    key={team.slug}
                    selected={isActive}
                    onClick={() => {
                      onTeamSelect?.(team.slug);
                    }}
                    aria-label={team.name}
                  >
                    <div
                      className="bg-sidebar-accent text-sidebar-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
                      aria-hidden
                    >
                      <Mark name={team.name} logoUrl={team.logoUrl} />
                    </div>
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm font-medium">
                        {team.name}
                      </span>
                      <span className="text-kumo-secondary truncate text-xs">
                        {team.slug}
                      </span>
                    </div>
                  </DropdownMenu.Item>
                );
              })}
              {onCreateOrganization ? (
                <DropdownMenu.Item icon={Plus} onClick={onCreateOrganization}>
                  New workspace
                </DropdownMenu.Item>
              ) : null}
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Group>
              <DropdownMenu.Label>Account</DropdownMenu.Label>
              <DropdownMenu.Label>
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <div className="bg-sidebar-accent overflow-hidden rounded-lg">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="size-8 object-cover"
                      />
                    ) : (
                      <div className="text-kumo-secondary flex size-8 items-center justify-center text-xs font-medium">
                        {initials || "U"}
                      </div>
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="text-kumo-secondary truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenu.Label>
              <DropdownMenu.Item icon={User} onClick={() => onOpenProfile?.()}>
                Profile settings
              </DropdownMenu.Item>
            </DropdownMenu.Group>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              icon={SignOut}
              onClick={() => {
                void onSignOut?.();
              }}
            >
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  );
}
