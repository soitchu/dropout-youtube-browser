/* eslint-disable prettier/prettier */
import type { Episode, Show } from "../types";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  PressEvent,
  Button,
  DropdownMenu,
  DropdownTrigger,
  Dropdown,
  DropdownItem,
} from "@heroui/react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import DropoutStorage from "@/storage";

export default function ShowCard({
  show,
  isShow = true,
  isInFavouriteDrawer = false,
  favouriteShows,
  addFavourite,
  removeFavourite,
  watchedEpisodes,
  setWatchedEpisodes,
  epShow,
  onClick,
}: {
  show: Show | Episode;
  isShow?: boolean;
  isInFavouriteDrawer?: boolean;
  favouriteShows?: Set<string>;
  addFavourite?: (show: Show) => Promise<void>;
  removeFavourite?: (show: Show) => Promise<void>;
  epShow?: Show;
  watchedEpisodes: Set<string>;
  setWatchedEpisodes: (episodes: Set<string>) => void;
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

  const [hasBeenWatched, setHasBeenWatched] = useState(() => {
    if (isShow) return false;
    const ep = show as Episode;

    return watchedEpisodes.has(ep.id);
  });

  useEffect(() => {
    if (isShow) return;

    const ep = show as Episode;

    if (hasBeenWatched) {
      watchedEpisodes.add(ep.id);
    } else {
      watchedEpisodes.delete(ep.id);
    }
  }, [hasBeenWatched]);

  useEffect(() => {
    if (isShow) return;

    const ep = show as Episode;

    const isWatched = watchedEpisodes.has(ep.id);
    setHasBeenWatched(isWatched);
  }, [watchedEpisodes]);

  const toggleWatched = useCallback(async () => {
    if (!show || isShow || !epShow) return;

    const showName = epShow!.title;
    const ep = show as Episode;
    if (hasBeenWatched) {
      await DropoutStorage.removeWatchedEpisode(showName, ep.id);
      setHasBeenWatched(false);
    } else {
      await DropoutStorage.addWatchedEpisode(showName, ep.id);
      setHasBeenWatched(true);
    }
  }, [show, epShow, hasBeenWatched]);

  const thumbnailUrl =
    ("thumbnail" in show ? show.thumbnail.url : show.thumbnails?.url) ?? "";

  return (
    <>
      <Card
        isPressable
        className="m-3 inline-block bg-[#feea3b] align-top"
        shadow="sm"
        style={{
          width: isInFavouriteDrawer ? "200px" : "300px",
        }}
        onContextMenu={() => console.log("item context menu")}
        onPress={onClick as (e: PressEvent) => void}
      >
        <CardBody className="relative overflow-visible p-0">
          {episodeLabel && (
            <div className="absolute top-2 left-2 bg-[#feea3b] text-black text-xs p-2 z-20 rounded-xl shadow-md">
              {episodeLabel}
            </div>
          )}
          <Button
            className="absolute top-2 right-2 bg-[#feea3b] text-black text-xs p-2 z-20 rounded-xl shadow-md min-w-[45px]"
            onPress={async () => {
              try {
                if (isShow) {
                  if (favouriteShows?.has(show.title)) {
                    await removeFavourite?.(show as Show);
                  } else {
                    await addFavourite?.(show as Show);
                  }
                } else {
                  await toggleWatched();
                }
              } catch (error) {
                console.error("Error toggling favourite:", error);
              }
            }}
          >
            {isShow &&
              (favouriteShows?.has(show.title) ? (
                <FavoriteIcon />
              ) : (
                <FavoriteBorderOutlinedIcon />
              ))}

            {!isShow &&
              (hasBeenWatched ? (
                <VisibilityIcon />
              ) : (
                <VisibilityOutlinedIcon />
              ))}
          </Button>
          {!isShow && (
            <Button className="absolute top-2 right-[60px] bg-[#feea3b] text-black text-xs p-2 z-20 rounded-xl shadow-md min-w-[45px]">
              <Dropdown>
                <DropdownTrigger>
                  <MoreVertIcon />
                </DropdownTrigger>
                <DropdownMenu
                  onAction={async (key) => {
                    try {
                      switch (key) {
                        case "toggleWatched":
                          await toggleWatched();
                          break;
                        case "markWatchedUntil":
                        case "markUnwatchedUntil":
                          const seasons = epShow?.season || {};
                          const epList: string[] = [];
                          const currentEp = show as Episode;

                          let hasSeenCurrent = false;
                          for (const season in seasons) {
                            const episodes = seasons[season].episodes;
                            for (const ep of episodes) {
                              epList.push(ep.id);
                              if (ep.id === currentEp.id) {
                                hasSeenCurrent = true;
                                break;
                              }
                            }

                            if (hasSeenCurrent) {
                              break;
                            }
                          }

                          if (key === "markWatchedUntil") {
                            await DropoutStorage.addBulkWatchedEpisodes(
                              epShow!.title,
                              epList
                            );

                            for (const epId of epList) {
                              watchedEpisodes.add(epId);
                            }

                            setWatchedEpisodes(new Set(watchedEpisodes));
                          } else {
                            await DropoutStorage.removeBulkWatchedEpisodes(
                              epShow!.title,
                              epList
                            );

                            for (const epId of epList) {
                              watchedEpisodes.delete(epId);
                            }

                            setWatchedEpisodes(new Set(watchedEpisodes));
                          }
                          break;
                      }
                    } catch (error) {
                      console.error("Error in dropdown action:", error);
                    }
                  }}
                >
                  <DropdownItem key="toggleWatched">
                    Mark as {hasBeenWatched ? "un" : ""}watched
                  </DropdownItem>
                  <DropdownItem key="markWatchedUntil">
                    Mark as watched <br />
                    until this episode
                  </DropdownItem>
                  <DropdownItem key="markUnwatchedUntil">
                    Mark as unwatched <br />
                    until this episode
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </Button>
          )}
          )
          <img
            alt={show.title}
            className="w-full object-cover h-[140px] drop-shadow-sm"
            loading="lazy"
            src={thumbnailUrl}
            width="100%"
          />
        </CardBody>
        <CardFooter className="text-small justify-between bg-[#feea3b] block">
          <b className="whitespace-break-spaces">{show.title}</b>
          <p>{lastUpdateAt}</p>
        </CardFooter>
      </Card>
    </>
  );
}
