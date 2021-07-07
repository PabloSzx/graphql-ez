import format from 'date-fns/format';
import Head from 'next/head';

import { Box, Center, Code, Container, Grid, Heading, Image, SimpleGrid, VStack } from '@chakra-ui/react';
import { PackageInstall, RemoteGHMarkdown } from '@guild-docs/client';
import { buildMDX, CompiledMDX } from '@guild-docs/server';
import { getPackagesData, PackageWithStats } from '@guild-docs/server/npm';
import { DocsContent, DocsTOC, MDXPage } from '@guild-docs/client';
import { MDXTOC } from '@guild-docs/client/toc';

import { packageInstallList, pluginsList } from '../../../plugins';

import type { GetStaticPaths, GetStaticProps } from 'next';

interface PluginPageProps {
  data: (PackageWithStats & { mdx: CompiledMDX })[];
}

type PluginPageParams = {
  id: string;
};

export const getStaticProps: GetStaticProps<PluginPageProps, PluginPageParams> = async ctx => {
  const pluginId = ctx.params?.id;

  const pluginsData =
    typeof pluginId === 'string'
      ? await getPackagesData({
          idSpecific: pluginId,
          packageList: pluginsList,
        })
      : [];

  const data = await Promise.all(
    pluginsData.map(async plugin => {
      return {
        ...plugin,
        mdx: await buildMDX(plugin.readme || plugin.stats?.collected?.metadata?.readme || ''),
      };
    })
  );

  return {
    props: {
      data,
    },
    // Revalidate at most once every 1 hour
    revalidate: 60 * 60,
  };
};

export const getStaticPaths: GetStaticPaths<PluginPageParams> = async () => {
  const plugins = await getPackagesData({
    packageList: pluginsList,
  });

  return {
    fallback: 'blocking',
    paths: plugins.map(({ identifier }) => {
      return {
        params: {
          id: identifier,
        },
      };
    }),
  };
};

export default function PluginPageContent({ data }: PluginPageProps) {
  if (!data.length) {
    return (
      <Center h="300px" flexDir={'column'}>
        <Heading as="h2" fontSize="xl" fontWeight="bold" marginY="1em">
          404
        </Heading>
        <Box>Plugin not found.</Box>
      </Center>
    );
  }

  const pluginData = data[0];

  return (
    <>
      <Head>
        <title>{pluginData.title} - GraphQL EZ Plugin</title>
      </Head>

      <Box as="section">
        <Container p={'1.5rem'} maxWidth={1200}>
          <Heading as="h2" fontSize="2xl" fontWeight="bold" marginBottom="1em">
            <a href="/plugins">Plugin Hub</a> {'>'} {pluginData.title}{' '}
            {pluginData.iconUrl ? <Image display="inline-block" src={pluginData.iconUrl} boxSize="50px" fit="contain" /> : null}
          </Heading>
          <Grid templateColumns={['1fr', '1fr', '1fr 250px']} gap={4}>
            <Box>
              <PackageInstall packages={packageInstallList(pluginData)} />
              <RemoteGHMarkdown
                directory={pluginData.stats?.collected?.metadata?.repository?.directory}
                repo={pluginData.stats?.collected?.metadata?.links?.repository}
                content={pluginData.mdx}
              />
            </Box>

            <VStack>
              <Box gridRow={['1', '1', 'auto']}>
                <Heading as="h2" fontSize="xl" fontWeight="bold" marginBottom="0.5em">
                  Plugin Details
                </Heading>
                <SimpleGrid columns={2} templateColumns="1fr 2fr">
                  <Box>Identifier</Box>
                  <Box>
                    <Code>{pluginData.npmPackage}</Code>
                  </Box>
                  {pluginData.stats?.collected?.metadata?.license ? (
                    <>
                      <Box>License</Box>
                      <Box>
                        <Code>{pluginData.stats.collected.metadata.license}</Code>
                      </Box>
                    </>
                  ) : null}
                  {pluginData.stats?.collected?.metadata?.version ? (
                    <>
                      <Box>Version</Box>
                      <Box>
                        <Code>{pluginData.stats.collected.metadata.version}</Code>
                      </Box>
                    </>
                  ) : null}
                  {pluginData.stats?.collected?.metadata?.date ? (
                    <>
                      <Box>Updated</Box>
                      <Box>
                        <Code>{format(new Date(pluginData.stats.collected.metadata.date), 'MMM do, yyyy')}</Code>
                      </Box>
                    </>
                  ) : null}
                  {pluginData.stats?.collected?.github?.starsCount ? (
                    <>
                      <Box>Stars</Box>
                      <Box>
                        <Code>{pluginData.stats.collected.github?.starsCount}</Code>
                      </Box>
                    </>
                  ) : null}
                </SimpleGrid>
              </Box>
              <DocsTOC>
                <MDXTOC
                  toc={pluginData.mdx.toc}
                  wrapperProps={{
                    display: 'block',
                  }}
                />
              </DocsTOC>
            </VStack>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
