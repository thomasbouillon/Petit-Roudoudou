'use client';

import Image, { ImageProps, getImageProps } from 'next/image';
import { loader } from '../utils/next-image-directus-loader';
import { forwardRef } from 'react';

type Props = Omit<ImageProps, 'loader'> & { srcDesktop?: string; desktopBreakCssMediaCondition?: string };

export const CmsImage = forwardRef<HTMLImageElement, Props>((props, ref) => {
  if (props.srcDesktop) {
    if (!props.desktopBreakCssMediaCondition)
      throw new Error('desktopBreakCssMediaCondition is required when srcDesktop is provided');

    const { srcSet: desktopImgSrcSet } = props.srcDesktop
      ? getImageProps({
          ...props,
          src: props.srcDesktop,
          loader,
        }).props
      : { srcSet: null };

    const mobileImgProps = getImageProps({
      ...props,
      loader,
    }).props;

    delete (mobileImgProps as any).srcDesktop;
    delete (mobileImgProps as any).desktopBreakCssMediaCondition;

    return (
      <picture>
        {!!desktopImgSrcSet && <source srcSet={desktopImgSrcSet} media={props.desktopBreakCssMediaCondition} />}
        <img {...mobileImgProps} className="object-center object-cover" />
      </picture>
    );
  }
  return <Image {...props} loader={loader} ref={ref} />;
});
