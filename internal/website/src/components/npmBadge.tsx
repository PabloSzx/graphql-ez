import { Image, useImage, Link, Skeleton } from '@chakra-ui/react';

export const NPMBadge = ({ name }: { name: string }) => {
  const encodedPackage = encodeURIComponent(name);
  const src = `https://badge.fury.io/js/${encodedPackage}.svg`;
  const status = useImage({
    src,
  });

  const isLoaded = status === 'loaded';

  return (
    <Link alignSelf="flex-end" justifySelf="flex-end" href={`https://www.npmjs.com/package/${encodedPackage}`} target="_blank">
      <Skeleton
        opacity={isLoaded ? undefined : '0.5'}
        colorScheme="gray"
        animation="ease-in-out"
        width="115px"
        height="25px"
        isLoaded={isLoaded}
      >
        <Image src={src} alt="npm version" height="18" />
      </Skeleton>
    </Link>
  );
};
