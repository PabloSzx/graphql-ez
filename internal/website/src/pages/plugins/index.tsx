import { ClassNames } from '@emotion/react';
import { handlePushRoute, MDX, PackageInstall, RemoteGHMarkdown } from '@guild-docs/client';
import { buildMultipleMDX, CompiledMDX } from '@guild-docs/server';
import { getPackagesData, PackageWithStats } from '@guild-docs/server/npm';
import { MarketplaceSearch } from '@theguild/components';
import type { IMarketplaceItemProps } from '@theguild/components/dist/types/components';
import compareDesc from 'date-fns/compareDesc';
import type { GetStaticProps } from 'next';
import Head from 'next/head';
import { useMemo } from 'react';
import { packageInstallList, pluginsList, TagsList } from '../../../plugins';
import { NPMBadge } from '../../components/NPMBadge';

interface MarketplaceProps {
  data: (PackageWithStats & { description: CompiledMDX; content: CompiledMDX })[];
}

const tagsListString = [...TagsList];

export const getStaticProps: GetStaticProps<MarketplaceProps> = async () => {
  const pluginsData = await getPackagesData({
    packageList: pluginsList,
  });

  const data = await Promise.all(
    pluginsData.map(async plugin => {
      const [description, content] = await buildMultipleMDX([
        `${plugin.stats?.collected?.metadata?.version || ''}\n\n${
          plugin.descriptionMarkdown || plugin.stats?.collected?.metadata?.description || ''
        }`,
        plugin.readme || plugin.stats?.collected?.metadata?.readme || '',
      ]);
      return {
        ...plugin,
        description,
        content,
      };
    })
  );

  return {
    props: {
      data,
    },
    // Revalidate at most once every 1 hour
    // revalidate: 60 * 60,
  };
};

export default function Marketplace({ data }: MarketplaceProps) {
  const marketplaceItems: Array<IMarketplaceItemProps & { raw: PackageWithStats }> = useMemo(() => {
    if (data && data.length > 0) {
      return data.map<IMarketplaceItemProps & { raw: PackageWithStats }>(rawPlugin => {
        const linkHref = `/plugins/${rawPlugin.identifier}`;
        return {
          raw: rawPlugin,
          title: rawPlugin.title,
          link: {
            href: linkHref,
            title: `${rawPlugin.title} plugin details`,
            onClick: ev => handlePushRoute(linkHref, ev),
          },
          tags: rawPlugin.tags,
          description: <MDX mdx={rawPlugin.description.mdx} />,
          modal: {
            header: {
              image: rawPlugin.iconUrl
                ? {
                    src: rawPlugin.iconUrl,
                    alt: rawPlugin.title,
                  }
                : undefined,
              description: {
                href: `https://www.npmjs.com/package/${rawPlugin.npmPackage}`,
                children: `${rawPlugin.npmPackage} on npm`,
                title: `${rawPlugin.npmPackage} on NPM`,
                target: '_blank',
                rel: 'noopener noreferrer',
              },
            },
            content: (
              <>
                <NPMBadge name={rawPlugin.npmPackage} />
                <PackageInstall packages={packageInstallList(rawPlugin)} />
                <RemoteGHMarkdown
                  directory={rawPlugin.stats?.collected?.metadata?.repository?.directory}
                  repo={rawPlugin.stats?.collected?.metadata?.links?.repository}
                  content={rawPlugin.content}
                />
              </>
            ),
          },
          update: rawPlugin.stats?.collected?.metadata?.date || new Date().toISOString(),
          image: rawPlugin.iconUrl
            ? {
                height: 60,
                width: 60,
                src: rawPlugin.iconUrl,
                alt: rawPlugin.title,
              }
            : undefined,
        };
      });
    }

    return [];
  }, [data]);

  const recentlyUpdatedItems = useMemo(() => {
    if (marketplaceItems && marketplaceItems.length > 0) {
      return [...marketplaceItems].sort((a, b) => {
        return compareDesc(new Date(a.update), new Date(b.update));
      });
    }

    return [];
  }, [marketplaceItems]);

  const trendingItems = useMemo(() => {
    if (marketplaceItems && marketplaceItems.length > 0) {
      return [...marketplaceItems]
        .filter(i => i.raw.stats?.collected?.npm.downloads)
        .sort((a, b) => {
          const aMonthlyDownloads = a.raw.stats?.collected.npm.downloads[2].count || 0;
          const bMonthlyDownloads = b.raw.stats?.collected.npm.downloads[2].count || 0;

          return bMonthlyDownloads - aMonthlyDownloads;
        });
    }

    return [];
  }, [marketplaceItems]);

  return (
    <>
      <Head>
        <title>Plugin Hub - GraphQL EZ</title>
      </Head>

      <ClassNames>
        {({ css }) => {
          const patchTags = css`
            span > div {
              display: flex;
              flex-wrap: wrap;
              width: min(20em, 50vw);
            }
            span > div > * {
              margin: 1px;
            }
          `;

          const patchTagsResult = css`
            span > div {
              display: flex;
              flex-wrap: wrap;
              width: min(30em, 50vw);
            }
            span > div > * {
              margin: 1px;
            }
          `;
          return (
            <MarketplaceSearch
              title="Explore Plugin Hub"
              placeholder="Find plugins..."
              tagsFilter={tagsListString}
              wrapperProps={{
                className: css`
                  td:first-child {
                    width: 60px !important;
                  }
                `,
              }}
              containerProps={{
                className: css`
                  > div:first-of-type {
                    display: flex;
                    width: min(30em, 100vw);
                    flex-wrap: wrap;
                  }
                  > div:first-of-type > div {
                    margin: 1px;
                  }
                `,
              }}
              primaryList={{
                title: 'Trending',
                items: trendingItems,
                placeholder: '0 items',
                pagination: 12,
                itemProps: {
                  linkProps: {
                    className: patchTags,
                  },
                },
              }}
              secondaryList={{
                title: 'Recently Updated',
                items: recentlyUpdatedItems,
                placeholder: '0 items',
                pagination: 12,
                itemProps: {
                  linkProps: {
                    className: patchTags,
                  },
                },
              }}
              queryListProps={{
                //@ts-expect-error
                itemProps: {
                  linkProps: {
                    className: patchTagsResult,
                  },
                },
              }}
              queryList={{
                title: 'Search Results',
                items: marketplaceItems,
                placeholder: 'No results for {query}',
                pagination: 12,
              }}
            />
          );
        }}
      </ClassNames>
    </>
  );
}
