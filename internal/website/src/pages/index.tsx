import { Box, chakra, Heading, HStack, Link, Stack, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import { ClassNames } from '@emotion/react';
import { handlePushRoute, NPMBadge } from '@guild-docs/client';
import { HeroGradient, InfoList } from '@theguild/components';
import Router from 'next/router';
import { ReactNode, useEffect } from 'react';
import {
  CloudflareWorkersLogo,
  ExpressLogo,
  FastifyLogo,
  HapiLogo,
  KoaLogo,
  NextjsLogo,
  NodeLogo,
  SvelteKitLogo,
  VercelLogo,
} from '../components/logos';

function ItemDescription({ description, packageName }: { description: string; packageName: string }) {
  return (
    <VStack height="100%" align="flex-start" justify="space-around">
      <Text maxHeight="50px">{description}</Text>
      <NPMBadge name={packageName} />
    </VStack>
  );
}

function IntegrationItemTitle({ name, logo, integrationWebsite }: { name: string; logo: ReactNode; integrationWebsite: string }) {
  return (
    <HStack spacing="1.1em" justifyContent="space-around">
      <Heading as="h3">{name}</Heading>
      <Box
        as="a"
        cursor="pointer"
        title={integrationWebsite}
        href={integrationWebsite}
        _hover={{
          shadow: 'lg',
          borderRadius: '10px',
        }}
      >
        {logo}
      </Box>
    </HStack>
  );
}

export default function Index() {
  useEffect(() => {
    Router.prefetch('/docs');
    Router.prefetch('/plugins');
  }, []);
  return (
    <ClassNames>
      {({ css }) => (
        <>
          <HeroGradient
            title={
              <Stack>
                <chakra.img width="150px" src="/assets/ez/logo_horizontal_transparent.svg" alt="GraphQL EZ Logo" />
                <Text as="span">GraphQL EZ</Text>
              </Stack>
            }
            description={
              <Text as="span">
                Easy, feature complete, and Plugin-Based{' '}
                <Link href="https://www.envelop.dev/" fontWeight="bold">
                  Envelop
                </Link>{' '}
                GraphQL APIs
              </Text>
            }
            link={{
              href: '/docs',
              children: 'Get Started',
              title: 'Get started with GraphQL EZ',
              onClick: e => handlePushRoute('/docs', e),
            }}
            colors={['#969696', '#303030']}
            version={<NPMBadge name="graphql-ez" />}
            containerProps={{
              className: css({
                '> div': {
                  paddingTop: '3rem',
                },
              }),
            }}
            imageProps={{
              className: css({
                width: '240px',
                marginTop: '6rem',
                marginRight: '100px',

                objectFit: 'contain',
              }),
            }}
            image={{
              src: '/assets/ez/illustration.png',
              alt: 'Illustration',
            }}
          />

          <InfoList
            title="Integrations"
            itemTitleProps={{
              className: css({
                marginTop: '1em !important',
              }),
            }}
            containerProps={{
              className: css`
                article {
                  box-shadow: ${useColorModeValue(
                    'rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px',
                    'rgba(255, 255, 255, 0.1) 0px 4px 6px -1px, rgba(255, 255, 255, 0.06) 0px 2px 4px -1px'
                  )};
                  transition: box-shadow 0.5s;
                  border-radius: 10px;
                  margin: 0.3rem;
                  padding: 1rem;
                  max-width: 300px;
                  height: 250px;
                  overflow-y: hidden;
                }

                article:hover {
                  box-shadow: ${useColorModeValue(
                    'rgba(0, 0, 0, 0.1) 0px 13.32415px 12.98623px -1.44138px, rgba(0, 0, 0, 0.06) 0px 2.44138px 4.44138px -1.22069px',
                    'rgba(255, 255, 255, 0.1) 0px 13.32415px 12.98623px -1.44138px, rgba(255, 255, 255, 0.06) 0px 2.44138px 4.44138px -1.22069px'
                  )};
                }

                div {
                  justify-content: space-around;
                }

                a {
                  font-weight: bold;
                }
              `,
            }}
            items={[
              {
                title: <IntegrationItemTitle name="Fastify" integrationWebsite="https://fastify.io" logo={<FastifyLogo />} />,
                description: (
                  <ItemDescription
                    description="Fast and low overhead web framework, for Node.js"
                    packageName="@graphql-ez/fastify"
                  />
                ),
                link: {
                  href: '/docs/integrations/fastify',
                  title: 'Fastify Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/fastify', e),
                },
              },
              {
                title: <IntegrationItemTitle name="Express" integrationWebsite="https://expressjs.com/" logo={<ExpressLogo />} />,
                description: (
                  <ItemDescription
                    description="Fast, unopinionated, minimalist web framework for Node.js"
                    packageName="@graphql-ez/express"
                  />
                ),
                link: {
                  href: '/docs/integrations/express',
                  title: 'Express Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/express', e),
                },
              },
              {
                title: <IntegrationItemTitle name="Hapi" integrationWebsite="https://hapi.dev/" logo={<HapiLogo />} />,
                description: (
                  <ItemDescription
                    description="Build powerful, scalable applications, with minimal overhead and full out-of-the-box functionality"
                    packageName="@graphql-ez/hapi"
                  />
                ),
                link: {
                  href: '/docs/integrations/hapi',
                  title: 'Hapi Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/hapi', e),
                },
              },
              {
                title: <IntegrationItemTitle name="Koa" integrationWebsite="https://koajs.com/" logo={<KoaLogo />} />,
                description: (
                  <ItemDescription description="Next generation web framework for Node.js" packageName="@graphql-ez/koa" />
                ),
                link: {
                  href: '/docs/integrations/koa',
                  title: 'Koa Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/koa', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="Node.js HTTP"
                    integrationWebsite="https://nodejs.org/api/http.html"
                    logo={<NodeLogo />}
                  />
                ),
                description: <ItemDescription description="Core Node.js HTTP server" packageName="@graphql-ez/http" />,
                link: {
                  href: '/docs/integrations/http',
                  title: 'HTTP Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/http', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="Next.js API Routes"
                    integrationWebsite="https://nextjs.org/docs/api-routes/introduction"
                    logo={<NextjsLogo />}
                  />
                ),
                description: (
                  <ItemDescription description="The React Framework for Production" packageName="@graphql-ez/nextjs" />
                ),
                link: {
                  href: '/docs/integrations/nextjs',
                  title: 'Next.js Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/nextjs', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="Cloudflare Workers"
                    integrationWebsite="https://workers.cloudflare.com/"
                    logo={<CloudflareWorkersLogo />}
                  />
                ),
                description: (
                  <ItemDescription
                    description="Deploy serverless code instantly across the globe to give it exceptional performance, reliability, and scale."
                    packageName="@graphql-ez/cloudflare"
                  />
                ),
                link: {
                  href: '/docs/integrations/cloudflare',
                  title: 'Cloudflare Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/cloudflare', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="SvelteKit"
                    integrationWebsite="hhttps://kit.svelte.dev/"
                    logo={<SvelteKitLogo height="80px" />}
                  />
                ),
                description: (
                  <ItemDescription description="The fastest way to build Svelte apps." packageName="@graphql-ez/sveltekit" />
                ),
                link: {
                  href: '/docs/integrations/sveltekit',
                  title: 'SvelteKit Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/sveltekit', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="Vercel Node.js Serverless"
                    integrationWebsite="https://vercel.com/docs/runtimes#official-runtimes/node-js"
                    logo={<VercelLogo height="80px" />}
                  />
                ),
                description: (
                  <ItemDescription description="Deploy Serverless GraphQL APIs with Vercel." packageName="@graphql-ez/vercel" />
                ),
                link: {
                  href: '/docs/integrations/vercel',
                  title: 'Vercel Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/integrations/vercel', e),
                },
              },
            ]}
          />
        </>
      )}
    </ClassNames>
  );
}
