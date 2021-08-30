import '../../public/style.css';
import '../components/logos';

import { chakra, extendTheme, Heading, HStack, LinkBox, LinkOverlay, theme as chakraTheme, VStack } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';
import { AppSeoProps, CombinedThemeProvider, DocsPage, ExtendComponents, handlePushRoute } from '@guild-docs/client';
import { Footer, Header, Subheader } from '@theguild/components';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';

ExtendComponents({
  Heading,
  HStack,
  VStack,
  a: chakra('a', {
    baseStyle: {
      color: '#2f77c9',
      _hover: {
        textDecoration: 'underline',
      },
    },
  }),
  LinkBox,
  LinkOverlay,
  img: chakra.img,
});

const styles: typeof chakraTheme['styles'] = {
  global: props => ({
    body: {
      bg: mode('white', 'gray.850')(props),
    },
  }),
};

const theme = extendTheme({
  colors: {
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      850: '#1b1b1b',
      900: '#171717',
    },
  },
  fonts: {
    heading: 'TGCFont, sans-serif',
    body: 'TGCFont, sans-serif',
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles,
});

const accentColor = '#55cf7e';

const serializedMdx = process.env.SERIALIZED_MDX_ROUTES;
const mdxRoutes = { data: serializedMdx && JSON.parse(serializedMdx) };

function AppContent(appProps: AppProps) {
  const { Component, pageProps, router } = appProps;
  const isDocs = router.asPath.startsWith('/docs');

  return (
    <>
      <Header accentColor={accentColor} activeLink="/open-source" themeSwitch />
      <Subheader
        activeLink={router.asPath}
        product={{
          title: 'GraphQL EZ',
          description: '',
          image: {
            src: '/assets/ez/logo_small.svg',
            alt: 'Docs',
          },
          onClick: e => handlePushRoute('/', e),
        }}
        links={[
          {
            children: 'Home',
            title: 'GraphQL EZ',
            href: '/',
            onClick: e => handlePushRoute('/', e),
          },
          {
            children: 'Docs & API',
            title: 'Read more about GraphQL EZ',
            href: '/docs',
            onClick: e => handlePushRoute('/docs', e),
          },
          {
            children: 'Plugin Hub',
            title: 'Check all the available plugins',
            href: '/plugins',
            onClick: e => handlePushRoute('/plugins', e),
          },
          {
            children: 'Envelop',
            href: 'https://www.envelop.dev/',
            target: '_blank',
            rel: 'noopener',
            title: 'Read more about Envelop. The underlying GraphQL Engine',
          },
          {
            children: 'GitHub',
            href: 'https://github.com/PabloSzx/graphql-ez',
            target: '_blank',
            rel: 'noopener norefereer',
            title: "Head to the project's GitHub",
          },
        ]}
        cta={{
          children: 'Get Started',
          title: 'Start using GraphQL EZ',
          href: '/docs',
          onClick: e => handlePushRoute('/docs', e),
        }}
      />
      {isDocs ? (
        <DocsPage
          appProps={appProps}
          accentColor={accentColor}
          mdxRoutes={mdxRoutes}
          mdxNavigationProps={{
            defaultOpenDepth: 2,
            summaryProps() {
              return {
                textTransform: 'none',
              };
            },
            linkProps() {
              return {
                textTransform: 'none',
              };
            },
          }}
        />
      ) : (
        <Component {...pageProps} />
      )}
      <Footer />
    </>
  );
}

const AppContentWrapper = appWithTranslation(function TranslatedApp(appProps) {
  return <AppContent {...appProps} />;
});

const defaultSeo: AppSeoProps = {
  title: 'GraphQL EZ',
  description: 'Easy, feature complete, and Plugin-Based Envelop GraphQL APIs',
  logo: {
    url: 'https://www.graphql-ez.com/assets/ez/logo_square_bg.png',
    width: 50,
    height: 54,
  },
};

export default function App(appProps: AppProps) {
  return (
    <CombinedThemeProvider theme={theme} accentColor={accentColor} defaultSeo={defaultSeo}>
      <AppContentWrapper {...appProps} />
    </CombinedThemeProvider>
  );
}
