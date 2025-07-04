import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export enum EpisodeType {
  Trailer = -2,
  Extras = -3,
  Unnumbered = -4,
}

export type EpisodeNumber = number | EpisodeType;

export type Episode = {
  thumbnails: {
    url: string;
    width: number;
    height: number;
  };
  title: string;
  number: number;
  id: string;
  publishedAt: string;
  lastUpdatedAt?: Date;
};

export type Show = {
  title: string;
  lastUpdatedAt?: Date;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  season: Record<
    number,
    {
      id: string;
      episodes: Episode[];
    }
  >;
};

export type ShowMap = Record<string, Show>;
export type ShowArray = Array<Show>;
