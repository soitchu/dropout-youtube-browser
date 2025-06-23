import type { Episode, Show } from "../types";

import { useMemo } from "react";
import {
  Card,
  CardBody,
  Image,
  CardFooter,
  PressEvent,
  Button,
} from "@heroui/react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";

export default function ShowCard({
  show,
  isShow = true,
  favouriteShows,
  addFavourite,
  removeFavourite,
  onClick,
}: {
  show: Show | Episode;
  isShow?: boolean;
  favouriteShows?: string[];
  addFavourite?: (show: Show) => void;
  removeFavourite?: (show: Show) => void;
  onClick: Function;
}) {
  const lastUpdateAt = useMemo(() => {
    if (!("lastUpdatedAt" in show)) {
      show.lastUpdatedAt = new Date((show as Episode).publishedAt);
    }

    const currentTimestamp = new Date().getTime();
    const lastUpdateTimestamp = show.lastUpdatedAt?.getTime() || 0;
    const diff = currentTimestamp - lastUpdateTimestamp;

    if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
      return "Today";
    } else if (diff >= 24 * 60 * 60 * 1000 && diff < 7 * 24 * 60 * 60 * 1000) {
      const daysAgo = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${daysAgo} day${daysAgo > 1 ? "s" : ""} ago`;
    }

    return show.lastUpdatedAt?.toDateString() || "Unknown";
  }, [show]);

  const episodeLabel = useMemo(() => {
    if ("number" in show) {
      if (show.number === -2) {
        return "Trailer";
      } else if (show.number === -3) {
        return "Extras";
      } else if (show.number === -4) {
        return "Unnumbered";
      }
      return `Ep. ${show.number}`;
    }

    if ("season" in show) {
      const keys = Object.keys(show.season);
      const lastSeason = parseInt(keys[keys.length - 1]);

      if (!isNaN(lastSeason)) {
        return `${lastSeason} Season${lastSeason > 1 ? "s" : ""}`;
      }
    }

    return null;
  }, [show]);

  const thumbnailUrl =
    ("thumbnail" in show ? show.thumbnail.url : show.thumbnails?.url) ?? "";

  return (
    <>
      <Card
        isPressable
        className="w-[300px] m-3 inline-block bg-[#feea3b] align-top"
        shadow="sm"
        onContextMenu={() => console.log("item context menu")}
        onPress={onClick as (e: PressEvent) => void}
      >
        <CardBody className="relative overflow-visible p-0">
          {episodeLabel && (
            <div className="absolute top-2 left-2 bg-[#feea3b] text-black text-xs p-2 z-20 rounded-xl shadow-md">
              {episodeLabel}
            </div>
          )}

          {isShow && (
            <Button
              className="absolute top-2 right-2 bg-[#feea3b] text-black text-xs p-2 z-20 rounded-xl shadow-md min-w-[45px]"
              onPress={() => {
                if (favouriteShows?.includes(show.title)) {
                  removeFavourite?.(show as Show);
                } else {
                  addFavourite?.(show as Show);
                }
              }}
            >
              {favouriteShows?.includes(show.title) ? (
                <FavoriteIcon />
              ) : (
                <FavoriteBorderOutlinedIcon />
              )}
            </Button>
          )}

          <Image
            alt={show.title}
            className="w-full object-cover h-[140px]"
            radius="lg"
            shadow="sm"
            src={thumbnailUrl}
            width="100%"
          />
        </CardBody>
        <CardFooter className="text-small justify-between bg-[#feea3b] block">
          <b>{show.title}</b>
          <p>{lastUpdateAt}</p>
        </CardFooter>
      </Card>
    </>
  );
}
