'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

let instanceId = 0;

/** 渲染超时上限。mermaid 的 ELK 布局是独立异步 chunk，
 *  一旦该 chunk 加载失败，render() 会永远不 settle，
 *  没有超时就会留下一个高度为 0 的空盒子。 */
const RENDER_TIMEOUT = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} 超过 ${ms / 1000}s 未返回`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function renderChart(chart: string): Promise<string> {
  const { default: mermaid } = await import('mermaid');
  const dark = document.documentElement.classList.contains('dark');
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'neutral',
    fontFamily: 'Noto Serif SC, sans-serif',
  });
  const { svg } = await withTimeout(
    mermaid.render('mermaid-' + instanceId++, chart),
    RENDER_TIMEOUT,
    'mermaid.render',
  );
  return svg;
}

/**
 * mermaid 图表 island。
 * 在迁移脚本中由 ```mermaid 代码块转换而来（rehypeCode 会改写代码块结构，
 * 无法在产物 HTML 里可靠识别 mermaid 语言，因此改为显式组件）。
 */
export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const draw = useCallback(async () => {
    const svg = await renderChart(chart);
    if (ref.current) ref.current.innerHTML = svg;
  }, [chart]);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    draw().catch((e: unknown) => {
      if (cancelled) return;
      console.error('[mermaid] 渲染失败:', e);
      setError(e instanceof Error ? e.message : String(e));
    });

    // mermaid 在渲染时把颜色烘焙进 SVG，主题切换后必须重绘
    const observer = new MutationObserver(() => {
      draw().catch(() => {
        /* 重绘失败时保留上一张图，不覆盖错误提示 */
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [draw]);

  if (error) {
    return (
      <div className="my-6 overflow-x-auto">
        <p className="mb-2 text-xs text-fd-muted-foreground">图表渲染失败：{error}</p>
        <pre className="overflow-x-auto rounded-xl border bg-fd-secondary p-4 text-sm">
          {chart}
        </pre>
      </div>
    );
  }
  return <div ref={ref} className="my-6 overflow-x-auto text-center" />;
}
