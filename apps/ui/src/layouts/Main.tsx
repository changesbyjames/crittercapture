import { Button, Link } from '@critter/react/button/paper';

import { Binoculars } from '../components/assets/icons/Binoculars';
import { Picture } from '../components/assets/icons/Picture';

import { SignOut } from '../components/assets/icons/SignOut';
import { CritterCaptureClubLogo } from '../components/assets/logos/CritterCaptureClubLogo';

import { Menu, MenuItem } from '../components/menu/Menu';

import { Wordmark } from '@/components/assets/logos/Wordmark';
import { usePermissions } from '@/services/permissions/hooks';
import { Loading } from '@critter/react/loaders/Loading';
import { Suspense } from 'react';
import { Outlet } from 'react-router';

export const Main = () => {
  const { editor } = usePermissions();

  return (
    <div className="h-screen min-h-screen max-h-screen w-screen flex flex-col">
      {!editor && (
        <header className="h-fit bg-accent-50 px-8 py-4">
          <div className="flex items-center justify-between">
            <Wordmark />
            <div>
              <Link to="/auth/signout">
                <SignOut />
                Sign out
              </Link>
            </div>
          </div>
        </header>
      )}
      <div className="flex flex-1 items-stretch h-full">
        {editor && (
          <Menu>
            <MenuItem className="flex items-center justify-center py-4">
              <CritterCaptureClubLogo />
            </MenuItem>
            <MenuItem>
              <Button className="w-full" disabled>
                <Binoculars />
                All captures
              </Button>
            </MenuItem>
            <MenuItem>
              <Button className="w-full" disabled>
                <Binoculars />
                My captures
              </Button>
            </MenuItem>
            <MenuItem>
              <Link to="/snapshots/pending" className="w-full">
                <Picture />
                Pending screenshots
              </Link>
            </MenuItem>
            <div className="flex-1" />
            <MenuItem>
              <Link to="/auth/signout" className="w-full">
                <SignOut />
                Sign out
              </Link>
            </MenuItem>
          </Menu>
        )}
        <Suspense fallback={<Loading className="bg-accent-100" />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};
