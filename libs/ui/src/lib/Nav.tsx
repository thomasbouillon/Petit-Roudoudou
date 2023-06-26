import {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  PropsWithChildren,
} from 'react';

export function Nav({
  items,
  className,
  renderLink,
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    items: { href: string; label: string }[];
    renderLink: (
      href: string,
      label: string,
      htmlProps: AnchorHTMLAttributes<HTMLAnchorElement>
    ) => JSX.Element;
  }
>) {
  return (
    <nav className={className} {...props}>
      <ul className="flex flex-col pb-4 gap-2">
        {items.map((item) => (
          <li className="mx-2" key={item.href}>
            {renderLink(item.href, item.label, {})}
          </li>
        ))}
      </ul>
    </nav>
  );
}
