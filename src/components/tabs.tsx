'use client';
import { useState, type ReactNode } from 'react';

/**
 * Astro MDX 内容专用的内容标签页。
 *
 * 不使用 fumadocs 的 <Tabs>/<Tab>：Astro 的 MDX JSX 运行时会把每个元素
 * 作为独立的渲染根，React context 无法跨元素传递；同时内容子树是静态
 * HTML，需要本组件自身携带 client:load 才能交互。
 *
 * <Tab> 仅作结构标记（纯透传），其渲染结果按顺序作为 <Tabs> 的面板。
 */
export function Tabs({
  items,
  children,
}: {
  items: string[];
  children?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const panels = (Array.isArray(children) ? children : [children]).filter(
    (c) => c !== null && c !== undefined && c !== false && c !== '',
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-fd-secondary my-4">
      <div
        role="tablist"
        className="flex gap-3.5 overflow-x-auto px-4 pt-2 not-prose"
      >
        {items.map((item, i) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className="inline-flex items-center gap-2 whitespace-nowrap text-fd-muted-foreground border-b border-transparent py-2 text-sm font-medium transition-colors hover:text-fd-accent-foreground data-[state=active]:border-fd-primary data-[state=active]:text-fd-primary"
            data-state={i === active ? 'active' : 'inactive'}
          >
            {item}
          </button>
        ))}
      </div>
      {panels.slice(0, items.length).map((child, i) => (
        <div
          key={i}
          className={
            i === active
              ? 'p-4 text-[0.9375rem] bg-fd-background outline-none prose-no-margin'
              : 'hidden'
          }
        >
          {child}
        </div>
      ))}
    </div>
  );
}

export function Tab({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
