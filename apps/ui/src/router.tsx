import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { Main } from './layouts/Main';
import { Status } from './pages/admin/Status';
import { Authenticated } from './pages/authentication/Authenticated';
import { Redirect } from './pages/authentication/Redirect';
import { SignIn } from './pages/authentication/SignIn';
import { SignOut } from './pages/authentication/SignOut';
import { SignOutRedirect } from './pages/authentication/SignOutRedirect';
import { Docs, Document } from './pages/docs/Document';
import { Snapshot } from './pages/snapshots/Snapshot';

const auth: RouteObject = {
  path: 'auth',
  children: [
    {
      path: 'signin',
      element: <SignIn />
    },
    {
      path: 'signout',
      element: <SignOut />
    },
    {
      path: 'redirect',
      element: <Redirect />
    },
    {
      path: 'signout/redirect',
      element: <SignOutRedirect />
    }
  ]
};

export const router = createBrowserRouter([
  {
    element: <Authenticated />,
    children: [
      {
        element: <Main />,
        children: [
          {
            path: '/status',
            element: <Status />
          },
          {
            path: '/snapshots/:id',
            element: <Snapshot />
          },
          {
            path: '/docs',
            element: <Docs />,
            children: [
              {
                path: ':id',
                element: <Document />
              }
            ]
          }
        ]
      }
    ]
  },
  auth
]);
