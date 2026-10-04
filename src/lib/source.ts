import { loader } from 'fumadocs-core/source';
import { type CollectionEntry, getCollection } from 'astro:content';
import * as path from 'node:path';
import { structure, type StructuredData } from 'fumadocs-core/mdx-plugins';

export const source = loader({
  source: await createMySource(),
  baseUrl: '/',
});

/**
 * MDX 中的自定义组件会被原样写进搜索索引，导致搜索结果摘要出现
 * `<SiteInfo name="第二季" desc="…" />` 这类标记。
 * 先剥掉组件标记再交给 structure()：自闭合组件整段移除，
 * 成对组件只去掉开闭标签、保留其中的正文（如 Callout 内的提示文字）。
 */
function stripMdxComponents(body: string): string {
  return body
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*\/>/g, '')
    .replace(/<\/?([A-Z][A-Za-z0-9]*)\b[^>]*>/g, '');
}

export function getStructuredData(entry: CollectionEntry<'docs'>): StructuredData {
  return structure(stripMdxComponents(entry.body));
}

async function createMySource() {
  const out: {
    files: (
      | {
          type: 'page';
          path: string;
          data: CollectionEntry<'docs'>['data'] & {
            _raw: CollectionEntry<'docs'>;
          };
        }
      | {
          type: 'meta';
          path: string;
          data: CollectionEntry<'meta'>['data'];
        }
    )[];
  } = {
    files: [],
  };

  for (const page of await getCollection('docs')) {
    const virtualPath = path.relative('content/docs', page.filePath!);

    out.files.push({
      type: 'page',
      path: virtualPath,
      data: {
        ...page.data,
        _raw: page,
      },
    });
  }

  for (const meta of await getCollection('meta')) {
    const virtualPath = path.relative('content/docs', meta.filePath!);

    out.files.push({
      type: 'meta',
      path: virtualPath,
      data: meta.data,
    });
  }

  return out;
}
