import { CardH2 } from './card-h2';

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
    <CardH2
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
    </CardH2>
  );
}
