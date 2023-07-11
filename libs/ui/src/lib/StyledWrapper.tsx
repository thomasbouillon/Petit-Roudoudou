import clsx from 'clsx';
import { HTMLProps, PropsWithChildren } from 'react';

export function StyledWrapper({
  children,
  ...props
}: PropsWithChildren<HTMLProps<HTMLDivElement>>) {
  const backgroundColor = props.className
    ?.split(' ')
    .filter((className) => className.startsWith('bg-'))
    .join(' ');

  const padding = props.className
    ?.split(' ')
    .filter(
      (className) => className.match(/^(p|px|py|pt|pr|pb|pl)-[0-9]+$/) !== null
    )
    .join(' ');

  props.className = props.className
    ?.split(' ')
    .filter(
      (className) =>
        !className.startsWith('bg-') &&
        !className.match(/^(p|px|py|pt|pr|pb|pl)-[0-9]+$/) !== null
    )
    .join(' ');

  return (
    <div {...props}>
      <div className={clsx('triangle-top', backgroundColor)}></div>
      <div className={clsx(backgroundColor, padding)}>{children}</div>
      <div className={clsx('triangle-bottom', backgroundColor)}></div>
    </div>
  );
}
