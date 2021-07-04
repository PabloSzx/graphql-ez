import Image from 'next/image';

import { Box, Heading, HStack, Image as ChakraImage, Link, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import { ClassNames } from '@emotion/react';
import { handlePushRoute } from '@guild-docs/client';
import { HeroGradient, InfoList } from '@theguild/components';

import ExpressLogo from '../../public/express-logo.png';
import FastifyLogo from '../../public/fastify-logo.png';
import HapiLogo from '../../public/hapi-logo.png';
import KoaLogo from '../../public/koa-logo.png';
import NextjsLogo from '../../public/nextjs-logo.png';
import NodeLogo from '../../public/nodejs-logo.png';

function ItemDescription({ description, packageName }: { description: string; packageName: string }) {
  const encodedPackage = encodeURIComponent(packageName);
  return (
    <VStack height="100%" align="flex-start" justify="space-around">
      <Text maxHeight="50px">{description}</Text>
      <Link alignSelf="flex-end" justifySelf="flex-end" href={`https://www.npmjs.com/package/${encodedPackage}`} target="_blank">
        <ChakraImage src={`https://badge.fury.io/js/${encodedPackage}.svg`} alt="npm version" height="18" />
      </Link>
    </VStack>
  );
}

function IntegrationItemTitle({
  name,
  logoSrc,
  integrationWebsite,
}: {
  name: string;
  logoSrc: StaticImageData;
  integrationWebsite: string;
}) {
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
        <Image
          src={logoSrc}
          css={{
            backgroundColor: 'white',
            borderRadius: '10px',
            objectFit: 'contain',
            padding: '3px !important',
          }}
          layout="intrinsic"
          width="110px"
          height="50px"
          placeholder="blur"
        />
      </Box>
    </HStack>
  );
}

export default function Index() {
  return (
    <ClassNames>
      {({ css }) => (
        <>
          <HeroGradient
            title="GraphQL EZ"
            description={
              <Text as="span">
                Easy, feature complete, and Plugin-Based GraphQL APIs using{' '}
                <Link href="https://www.envelop.dev/" fontWeight="bold">
                  Envelop
                </Link>
              </Text>
            }
            link={{
              href: '/docs',
              children: 'Get Started',
              title: 'Get started with GraphQL EZ',
              onClick: e => handlePushRoute('/docs', e),
            }}
            colors={['#000000', '#1CC8EE']}
            version={
              <a href="https://www.npmjs.com/package/graphql-ez" target="_blank">
                <img src="https://badge.fury.io/js/graphql-ez.svg" alt="npm version" height="18" />
              </a>
            }
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
                  justify-content: space-between;
                }

                a {
                  font-weight: bold;
                }
              `,
            }}
            items={[
              {
                title: <IntegrationItemTitle name="Fastify" integrationWebsite="https://fastify.io" logoSrc={FastifyLogo} />,
                description: (
                  <ItemDescription
                    description="Fast and low overhead web framework, for Node.js"
                    packageName="@graphql-ez/fastify"
                  />
                ),
                link: {
                  href: '/docs/fastify',
                  title: 'Fastify Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/fastify', e),
                },
              },
              {
                title: <IntegrationItemTitle name="Express" integrationWebsite="https://expressjs.com/" logoSrc={ExpressLogo} />,
                description: (
                  <ItemDescription
                    description="Fast, unopinionated, minimalist web framework for Node.js"
                    packageName="@graphql-ez/express"
                  />
                ),
                link: {
                  href: '/docs/express',
                  title: 'Express Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/express', e),
                },
              },
              {
                title: <IntegrationItemTitle name="Hapi" integrationWebsite="https://hapi.dev/" logoSrc={HapiLogo} />,
                description: (
                  <ItemDescription
                    description="Build powerful, scalable applications, with minimal overhead and full out-of-the-box functionality"
                    packageName="@graphql-ez/hapi"
                  />
                ),
                link: {
                  href: '/docs/hapi',
                  title: 'Hapi Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/hapi', e),
                },
              },
              {
                title: <IntegrationItemTitle name="Koa" integrationWebsite="https://koajs.com/" logoSrc={KoaLogo} />,
                description: (
                  <ItemDescription description="Next generation web framework for Node.js" packageName="@graphql-ez/koa" />
                ),
                link: {
                  href: '/docs/koa',
                  title: 'Koa Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/koa', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="Node.js HTTP"
                    integrationWebsite="https://nodejs.org/api/http.html"
                    logoSrc={NodeLogo}
                  />
                ),
                description: <ItemDescription description="Core Node.js HTTP server" packageName="@graphql-ez/http" />,
                link: {
                  href: '/docs/http',
                  title: 'HTTP Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/http', e),
                },
              },
              {
                title: (
                  <IntegrationItemTitle
                    name="Next.js API Routes"
                    integrationWebsite="https://nextjs.org/docs/api-routes/introduction"
                    logoSrc={NextjsLogo}
                  />
                ),
                description: (
                  <ItemDescription description="The React Framework for Production" packageName="@graphql-ez/nextjs" />
                ),
                link: {
                  href: '/docs/nextjs',
                  title: 'Next.js Docs',
                  children: 'Docs',
                  onClick: e => handlePushRoute('/docs/nextjs', e),
                },
              },
            ]}
          />
        </>
      )}
    </ClassNames>
  );
}
