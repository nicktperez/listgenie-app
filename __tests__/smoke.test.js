import React from 'react';
import ReactDOMServer from 'react-dom/server';

jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }) => <div>{children}</div>,
  SignedOut: ({ children }) => <div>{children}</div>,
  SignInButton: ({ children }) => <div>{children}</div>,
  UserButton: () => <div />,
  useUser: () => ({ isSignedIn: false, user: null }),
}));

jest.mock('@/hooks/useUserPlan', () => ({
  __esModule: true,
  default: () => ({ isPro: false, canGenerate: true, daysLeft: 0, isLoading: false }),
}));

import IndexPage from '../pages/index';

describe('App', () => {
  it('renders without crashing', () => {
    ReactDOMServer.renderToString(<IndexPage />);
  });
});
