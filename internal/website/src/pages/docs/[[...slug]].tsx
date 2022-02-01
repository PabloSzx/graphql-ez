import Head from 'next/head';

import { DocsContent, DocsTOC, MDXPage } from '@guild-docs/client';
import { MDXPaths, MDXProps } from '@guild-docs/server';

import { getRoutes } from '../../../routes';

import type { GetStaticPaths, GetStaticProps } from 'next';

export default MDXPage(
  function PostPage({ content, TOC, MetaHead, BottomNavigation }) {
    return (
      <>
        <Head>{MetaHead}</Head>
        <DocsContent>{content}</DocsContent>
        <DocsTOC>
          <TOC />
          <BottomNavigation />
        </DocsTOC>
      </>
    );
  },
  {
    renderTitle(title) {
      return `${title} - GraphQL EZ`;
    },
    giscus: {
      repo: 'pabloszx/graphql-ez',
      repoId: 'MDEwOlJlcG9zaXRvcnkzNzQ3Mzk2NzI=',
      category: 'Q&A',
      categoryId: 'DIC_kwDOFlYS2M4B-eNs',
    },
  }
);

export const getStaticProps: GetStaticProps = ctx => {
  return MDXProps(
    ({ readMarkdownFile, getArrayParam }) => {
      return readMarkdownFile('docs/', getArrayParam('slug'));
    },
    ctx,
    {
      getRoutes,
    }
  );
};

export const getStaticPaths: GetStaticPaths = ctx => {
  return MDXPaths('docs', { ctx });
};
