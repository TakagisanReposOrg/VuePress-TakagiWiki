import type { ReactNode } from 'react';

/**
 * Fumadocs 的 <Card> 把标题渲染成 <h3>。本站页面标题本身是 <h1>，
 * 卡片作为页面的一级条目直接使用，中间没有 <h2>，形成 h1 → h3 的层级跳跃。
 *
 * 这里自行渲染同等结构的卡片，只把标题换成 <h2>，类名与 Card 保持一致，
 * 因此视觉无变化。结构对照 Fumadocs 产出的 markup 逐项复刻。
 */
export function CardH2({
  title,
  description,
  href,
  external,
  style,
  children,
}: {
  title: string;
  description?: string;
  href?: string;
  external?: boolean;
  style?: React.CSSProperties;
  children?: ReactNode;
}) {
  const body = (
    <>
      <h2 className="not-prose mb-1 text-sm font-medium">{title}</h2>
      {description ? (
        <p className="my-0! text-sm text-fd-muted-foreground">{description}</p>
      ) : null}
      <div className="text-sm text-fd-muted-foreground prose-no-margin empty:hidden">
        {children}
      </div>
    </>
  );

  const cls =
    'block rounded-xl border bg-fd-card p-4 text-fd-card-foreground transition-colors @max-lg:col-span-full hover:bg-fd-accent/80';

  if (!href) return <div className={cls} style={style}>{body}</div>;

  return (
    <a
      href={href}
      rel="noreferrer noopener"
      {...(external ? { target: '_blank' } : {})}
      style={style}
      data-card="true"
      className={cls}
    >
      {body}
    </a>
  );
}
