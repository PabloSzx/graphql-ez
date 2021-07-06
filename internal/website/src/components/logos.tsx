import Image, { ImageProps } from 'next/image';

import { ExtendComponents } from '@guild-docs/client';

import ExpressLogoImage from '../../public/assets/logos/express.png';
import FastifyLogoImage from '../../public/assets/logos/fastify.png';
import HapiLogoImage from '../../public/assets/logos/hapi.png';
import KoaLogoImage from '../../public/assets/logos/koa.png';
import NextjsLogoImage from '../../public/assets/logos/nextjs.png';
import NodeLogoImage from '../../public/assets/logos/nodejs.png';

export type LogoImageProps = Partial<Omit<ImageProps, 'src' | 'blurDataURL'>>;

export const baseLogoStyles: LogoImageProps = {
  css: {
    backgroundColor: 'white',
    borderRadius: '10px',
    objectFit: 'contain',
    padding: '3px !important',
  },
  layout: 'intrinsic',
  width: '110px',
  height: '50px',
  placeholder: 'blur',
};

export const ExpressLogo = (props: LogoImageProps) => {
  return <Image src={ExpressLogoImage} {...baseLogoStyles} {...props} />;
};
export const FastifyLogo = (props: LogoImageProps) => {
  return <Image src={FastifyLogoImage} {...baseLogoStyles} {...props} />;
};
export const HapiLogo = (props: LogoImageProps) => {
  return <Image src={HapiLogoImage} {...baseLogoStyles} {...props} />;
};
export const KoaLogo = (props: LogoImageProps) => {
  return <Image src={KoaLogoImage} {...baseLogoStyles} {...props} />;
};
export const NextjsLogo = (props: LogoImageProps) => {
  return <Image src={NextjsLogoImage} {...baseLogoStyles} {...props} />;
};
export const NodeLogo = (props: LogoImageProps) => {
  return <Image src={NodeLogoImage} {...baseLogoStyles} {...props} />;
};

ExtendComponents({
  ExpressLogo,
  FastifyLogo,
  HapiLogo,
  KoaLogo,
  NextjsLogo,
  NodeLogo,
});
