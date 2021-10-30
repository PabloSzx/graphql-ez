import Image, { ImageProps } from 'next/image';

import { ExtendComponents } from '@guild-docs/client';

import ExpressLogoImage from '../../public/assets/logos/express.png';
import FastifyLogoImage from '../../public/assets/logos/fastify.png';
import HapiLogoImage from '../../public/assets/logos/hapi.png';
import KoaLogoImage from '../../public/assets/logos/koa.png';
import NextjsLogoImage from '../../public/assets/logos/nextjs.png';
import NodeLogoImage from '../../public/assets/logos/nodejs.png';
import CloudflareWorkersLogoImage from '../../public/assets/logos/cloudflare-workers.webp';
import WorktopLogoImage from '../../public/assets/logos/worktop.png';
import SvelteKitLogoImage from '../../public/assets/logos/sveltekit.webp';
import VercelLogoImage from '../../public/assets/logos/vercel.png';

export type LogoImageProps = Partial<Omit<ImageProps, 'src' | 'blurDataURL'>> & { className: string };

export const baseLogoStyles: Partial<LogoImageProps> = {
  layout: 'intrinsic',
  width: '110px',
  height: '50px',
  placeholder: 'blur',
  objectFit: 'contain',
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

export const CloudflareWorkersLogo = (props: LogoImageProps) => {
  return <Image src={CloudflareWorkersLogoImage} {...baseLogoStyles} {...props} />;
};

export const WorktopLogo = (props: LogoImageProps) => {
  return <Image src={WorktopLogoImage} {...baseLogoStyles} {...props} />;
};
export const SvelteKitLogo = (props: LogoImageProps) => {
  return <Image src={SvelteKitLogoImage} {...baseLogoStyles} {...props} />;
};

export const VercelLogo = (props: LogoImageProps) => {
  return <Image src={VercelLogoImage} {...baseLogoStyles} {...props} />;
};

ExtendComponents({
  ExpressLogo,
  FastifyLogo,
  HapiLogo,
  KoaLogo,
  NextjsLogo,
  NodeLogo,
  CloudflareWorkersLogo,
  WorktopLogo,
  SvelteKitLogo,
  VercelLogo,
});
