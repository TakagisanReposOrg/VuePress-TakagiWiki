import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsPage, type DocsPageProps } from 'fumadocs-ui/layouts/docs/page';
import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/astro';
import SearchDialog from './search';

const links = [
  { url: '/guide/Home.html', text: '指南' },
  { url: '/music.html', text: '音乐' },
  { url: '/manga/Takagi-OG.html', text: '漫画' },
  { url: '/anime.html', text: '动画' },
  { url: '/role/Takagi-OG.html', text: '角色' },
  { url: '/derivative/McsClub.html', text: '衍生/社群' },
  { url: '/goods/Offical.html', text: '商品/周边' },
  { url: '/other/Info.html', text: '其他' },
];

const GITHUB =
  'https://github.com/TakagisanReposOrg/VuePress-TakagiWiki';

export function Docs({
  tree,
  children,
  pathname,
  params,
  page,
}: {
  tree: Root;
  children: ReactNode;
  pathname: string;
  params?: Record<string, string | undefined>;
  page?: DocsPageProps;
}) {
  return (
    <RootProvider
      pathname={pathname}
      params={params}
      search={{ SearchDialog }}
    >
      <DocsLayout
        tree={tree}
        nav={{
          title: '高木轻Wiki站',
          url: '/',
        }}
        links={links}
        githubUrl={GITHUB}
      >
        <DocsPage {...page}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
