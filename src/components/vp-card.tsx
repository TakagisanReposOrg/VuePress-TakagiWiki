import { Card } from 'fumadocs-ui/components/card';

/**
 * 兼容原 VuePress `<VPCard>` 组件的头像卡片：
 * title/desc/logo/link/background 属性原样保留。
 */
export default function VPCard({
  title,
  desc,
  logo,
  link,
  background,
}: {
  title: string;
  desc?: string;
  logo?: string;
  link?: string;
  background?: string;
}) {
  return (
    <Card
      title={title}
      description={desc}
      href={link}
      external={link ? /^https?:\/\//.test(link) : undefined}
      style={background ? { backgroundColor: background } : undefined}
    >
      {logo ? (
        <img
          src={logo}
          alt={title}
          className="h-12 w-12 rounded-full object-cover"
          loading="lazy"
        />
      ) : null}
    </Card>
  );
}
