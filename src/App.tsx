/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { Input } from "@heroui/input";
import {
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ScrollShadow,
  Select,
  SelectItem,
} from "@heroui/react";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";

import showJSON from "./shows.json";
import { EpisodeType, type Show, type ShowArray } from "./types";
import ShowCard from "./components/ShowCard";
import Filters, { FilterType } from "./components/Filters";
import DropoutStorage from "./storage";

function App() {
  const [shows, setShows] = useState<ShowArray | null>(null);
  const [searchResults, setSearchResults] = useState<ShowArray | null>(null);
  const [searchIndex, setSearchIndex] = useState<Fuse<Show> | null>(null);
  const [modalShow, setModalShow] = useState<
    | {
        show: Show;
        selectedSeason: number;
      }
    | undefined
  >();
  const defaultFilters = useMemo(() => {
    try {
      const storedFilters = localStorage.getItem("filters");
      if (storedFilters) {
        return JSON.parse(storedFilters) as FilterType[];
      }

      throw new Error("No filters found in localStorage");
    } catch {
      return [
        FilterType.Extras,
        FilterType.Numbered,
        FilterType.Trailer,
        FilterType.Unnumbered,
      ];
    }
  }, []);
  const [favouriteShows, setFavouriteShows] = useState(new Set<string>());
  const [watchedEpisodes, setWatchedEpisodes] = useState(new Set<string>());
  const [favouriteDrawerOpen, setFavouriteDrawerOpen] = useState(
    localStorage.getItem("favouriteDrawerOpen") === "true"
  );
  const [filters, setFilters] = useState<FilterType[]>(defaultFilters);

  useEffect(() => {
    if (shows) return;

    const response = showJSON as ShowArray;
    response.forEach((show) => {
      const seasons = Object.keys(show.season);
      const lastSeason = seasons[seasons.length - 1] as unknown as number;
      const episodes = show.season[lastSeason].episodes;
      const lastEpisode = episodes[episodes.length - 1];

      show.lastUpdatedAt = new Date(lastEpisode.publishedAt);
    });

    response.sort((a, b) => {
      return (
        (b.lastUpdatedAt?.getTime() ?? 0) - (a.lastUpdatedAt?.getTime() ?? 0)
      );
    });

    const index = new Fuse(response, {
      keys: ["title"],
      isCaseSensitive: false,
    });

    (async () => {
      try {
        const favourites = await DropoutStorage.getFavourites();
        setFavouriteShows(favourites);
      } catch (error) {
        console.error("Failed to load favourites:", error);
      }

      try {
        const watchedEpisodes = await DropoutStorage.getWatchedEpisodes();
        setWatchedEpisodes(watchedEpisodes);
      } catch (error) {
        console.error("Failed to load watched episodes:", error);
      }
    })();

    setSearchIndex(index);
    setShows(response);
    setSearchResults(response);
    updateShowModal(response);
  }, []);

  useEffect(() => {
    localStorage.setItem("filters", JSON.stringify(filters));
  }, [filters]);

  const openShowModal = function (metadata: Show | undefined) {
    if (metadata) {
      const defaultSeason = parseInt(
        localStorage.getItem(metadata?.title ?? "") ?? ""
      );
      let seasonNumber = parseInt(Object.keys(metadata.season)[0]);

      if (!isNaN(defaultSeason)) {
        seasonNumber = defaultSeason;
      }

      setModalShow({
        selectedSeason: seasonNumber,
        show: metadata,
      });

      (async () => {
        try {
          if (!favouriteShows.has(metadata.title)) return;

          await DropoutStorage.addFavourite(metadata.title);

          setFavouriteShows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(metadata.title);
            newSet.add(metadata.title);
            return newSet;
          });
        } catch (error) {
          console.error("Error opening show modal:", error);
        }
      })();
    } else {
      setModalShow(undefined);
    }
  };

  const updateShowModal = useCallback(
    (_shows?: ShowArray | Event) => {
      if (!shows && !_shows) return;
      const currentShows = (shows || _shows) as ShowArray;
      const searchParams = new URLSearchParams(location.search);

      if (searchParams.has("modal") && searchParams.get("modal")) {
        const showName = searchParams.get("modal");
        const metadata = currentShows.find((show) => show.title === showName);

        if (metadata) {
          openShowModal(metadata);
        }
      } else {
        openShowModal(undefined);
      }
    },
    [shows]
  );

  const addFavourite = useCallback(
    async (show: Show) => {
      try {
        await DropoutStorage.addFavourite(show.title);
        setFavouriteShows((prev) => {
          const newSet = new Set(prev);
          newSet.add(show.title);
          return newSet;
        });
      } catch (error) {
        console.error("Failed to add favourite:", error);
      }
    },
    [favouriteShows]
  );

  const removeFavourite = useCallback(
    async (show: Show) => {
      await DropoutStorage.removeFavourite(show.title);
      setFavouriteShows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(show.title);
        return newSet;
      });
    },
    [favouriteShows]
  );

  useEffect(() => {
    window.addEventListener("popstate", updateShowModal);

    return () => {
      window.removeEventListener("popstate", updateShowModal);
    };
  }, [updateShowModal]);

  function search(event: any) {
    const query = event.target!.value;

    if (!searchIndex) {
      console.warn("Search index not initialized yet.");
      return;
    }

    if (query.length === 0) {
      setSearchResults(shows);
      return;
    }

    const results = searchIndex.search(query);

    if (results.length === 0) {
      console.log("No results found.");
      setSearchResults(null);
      return;
    }

    setSearchResults(results.map((result) => result.item) as ShowArray);
  }

  return (
    <div
      style={{
        textAlign: "center",
      }}
    >
      {favouriteShows.size > 0 && (
        <>
          <div
            className="text-white text-left w-full box-border text-3xl"
            role="button"
            style={{ padding: "20px" }}
            tabIndex={0}
            onClick={() => {
              localStorage.setItem(
                "favouriteDrawerOpen",
                (!favouriteDrawerOpen).toString()
              );
              setFavouriteDrawerOpen(!favouriteDrawerOpen);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" && event.key !== " ") return;
              localStorage.setItem(
                "favouriteDrawerOpen",
                (!favouriteDrawerOpen).toString()
              );
              setFavouriteDrawerOpen(!favouriteDrawerOpen);
            }}
          >
            <span>
              <b>Favourite Shows </b>
            </span>
            <ArrowDropDownCircleIcon
              fontSize="large"
              htmlColor="#feea3b"
              style={{
                verticalAlign: "top",
                transform: favouriteDrawerOpen
                  ? "rotate(0deg)"
                  : "rotate(-90deg)",
                transitionDuration: "200ms",
              }}
            />
          </div>
          <div
            className="text-white text-left w-full box-border text-2xl"
            style={{
              paddingLeft: "20px",
              paddingRight: "20px",
              whiteSpace: favouriteDrawerOpen ? "normal" : "nowrap",
              overflowX: favouriteDrawerOpen ? "visible" : "hidden",
            }}
          >
            <ScrollShadow
              className="w-full h-[400px] text-center"
              orientation="horizontal"
              size={50}
            >
              {[...favouriteShows].reverse().map((title) => {
                const show = shows?.find((s) => s.title === title);
                if (!show) return null;

                return (
                  <ShowCard
                    key={show.title}
                    addFavourite={addFavourite}
                    favouriteShows={favouriteShows}
                    isInFavouriteDrawer={true}
                    removeFavourite={removeFavourite}
                    setWatchedEpisodes={setWatchedEpisodes}
                    show={show}
                    watchedEpisodes={watchedEpisodes}
                    onClick={() => {
                      window.history.pushState({}, "", `?modal=${show.title}`);
                      openShowModal(show);
                    }}
                  />
                );
              })}
              {!favouriteDrawerOpen && (
                <div className="inline-block" style={{ width: "30px" }} />
              )}
            </ScrollShadow>
          </div>
        </>
      )}

      <div
        style={{
          position: "sticky",
          top: "0",
          left: "0",
          zIndex: 49,
          backgroundColor: "#141414ff",
        }}
      >
        {
          <div
            className="mx-auto"
            style={{
              width: "300px",
              maxWidth: "80%",
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            <Input placeholder="Search" onInput={search} />
          </div>
        }
      </div>
      {searchResults &&
        searchResults.map((metadata) => {
          return (
            <ShowCard
              key={metadata.title}
              addFavourite={addFavourite}
              favouriteShows={favouriteShows}
              removeFavourite={removeFavourite}
              setWatchedEpisodes={setWatchedEpisodes}
              show={metadata}
              watchedEpisodes={watchedEpisodes}
              onClick={() => {
                window.history.pushState({}, "", `?modal=${metadata.title}`);
                openShowModal(metadata);
              }}
            />
          );
        })}

      {modalShow && (
        <Modal
          backdrop="opaque"
          isOpen={true}
          size={"full"}
          onClose={() => {
            window.history.pushState({}, "", "?");
            openShowModal(undefined);
          }}
        >
          <ModalContent
            style={{
              background: "rgba(0, 0, 0, 0.8)",
            }}
          >
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="text-white text-4xl text-center">
                    {modalShow.show.title}
                  </div>
                </ModalHeader>
                <ModalBody className="block text-center overflow-auto">
                  <div
                    className="w-full h-[300px] flex justify-center"
                    style={{
                      marginBottom: "10px",
                    }}
                  >
                    <Image src={modalShow.show.thumbnail.url} width={500} />
                  </div>
                  <div
                    className="sticky top-0 w-full flex justify-center p-20"
                    style={{
                      zIndex: "3000",
                    }}
                  >
                    <div className="mt-5" style={{ width: "300px" }}>
                      <Select
                        defaultSelectedKeys={modalShow.selectedSeason.toString()}
                        onSelectionChange={(key) => {
                          const seasonNumber = [...(key as Set<string>)][0];

                          localStorage.setItem(
                            modalShow.show.title,
                            seasonNumber.toString()
                          );

                          setModalShow({
                            selectedSeason: parseInt(seasonNumber),
                            show: modalShow.show,
                          });
                        }}
                      >
                        {Object.entries(modalShow.show.season).map(
                          ([season]) => {
                            return (
                              <SelectItem
                                key={season}
                                aria-label={season}
                                textValue={`Season ${season}`}
                              >
                                {season}
                              </SelectItem>
                            );
                          }
                        )}
                      </Select>
                    </div>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <Filters
                      defaultFilters={defaultFilters}
                      onFilterChange={(type, checked) => {
                        if (checked) {
                          const newFilters = [...filters, type];
                          setFilters([...new Set(newFilters)]);
                        } else {
                          const newFilters = filters.filter(
                            (filter) => filter !== type
                          );
                          setFilters(newFilters);
                        }
                      }}
                    />
                  </div>

                  {modalShow.show.season[modalShow.selectedSeason]?.episodes
                    .filter((ep) => {
                      if (
                        filters.includes(FilterType.Unwatched) &&
                        watchedEpisodes.has(ep.id)
                      ) {
                        return false;
                      }

                      if (ep.number === EpisodeType.Extras) {
                        return filters.includes(FilterType.Extras);
                      }

                      if (ep.number === EpisodeType.Trailer) {
                        return filters.includes(FilterType.Trailer);
                      }

                      if (ep.number === EpisodeType.Unnumbered) {
                        return filters.includes(FilterType.Unnumbered);
                      }

                      return filters.includes(FilterType.Numbered);
                    })
                    .map((ep) => {
                      return (
                        <ShowCard
                          key={ep.id}
                          epShow={modalShow.show}
                          isShow={false}
                          setWatchedEpisodes={setWatchedEpisodes}
                          show={ep}
                          watchedEpisodes={watchedEpisodes}
                          onClick={() => {
                            window.open(
                              `https://www.youtube.com/watch?v=${ep.id}`,
                              "_blank"
                            );
                          }}
                        />
                      );
                    })}
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}

export default App;
