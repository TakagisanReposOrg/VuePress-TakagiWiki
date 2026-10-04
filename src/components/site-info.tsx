import { Card } from 'fumadocs-ui/components/card';

/**
 * 兼容原 VuePress `<SiteInfo>` 组件的卡片：
 * name/desc/url/preview 属性原样保留。
 */
export default function SiteInfo({
  name,
  desc,
  url,
  preview,
}: {
  name: string;
  desc?: string;
  url?: string;
  preview?: string;
}) {
  return (
    <Card
      title={name}
      description={desc}
      href={url}
      external={url ? /^https?:\/\//.test(url) : undefined}
    >
      {preview ? (
        <img
          src={preview}
          alt={name}
          className="w-full rounded-md object-cover"
          loading="lazy"
        />
      ) : null}
    </Card>
  );
}
