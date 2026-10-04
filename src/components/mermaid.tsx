'use client';
import { useEffect, useRef, useState } from 'react';

let instanceId = 0;

/**
 * mermaid 图表 island。
 * 在迁移脚本中由 ```mermaid 代码块转换而来（rehypeCode 会改写代码块结构，
 * 无法在产物 HTML 里可靠识别 mermaid 语言，因此改为显式组件）。
 */
export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        fontFamily: 'Noto Serif SC, sans-serif',
      });
      try {
        const { svg } = await mermaid.render(
          'mermaid-' + instanceId++,
          chart,
        );
        if (!cancelled && ref.current) ref.current.innerHTML = svg;
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (failed) {
    return (
      <pre className="my-6 overflow-x-auto rounded-xl border bg-fd-secondary p-4 text-sm">
        {chart}
      </pre>
    );
  }
  return <div ref={ref} className="my-6 overflow-x-auto text-center" />;
}
