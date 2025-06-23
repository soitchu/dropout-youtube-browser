/* eslint-disable prettier/prettier */
import type { Show, ShowArray } from "./types";

import { useCallback, useEffect, useState } from "react";
import Fuse from "fuse.js";
import { Input } from "@heroui/input";
import {
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";

import ShowCard from "./components/ShowCard";

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

  useEffect(() => {
    if (shows) return;

    fetch("/shows.json")
      .then((response) => response.json())
      .then((response: ShowArray) => {
        response.forEach((show) => {
          const seasons = Object.keys(show.season);
          const lastSeason = seasons[seasons.length - 1] as unknown as number;
          const episodes = show.season[lastSeason].episodes;
          const lastEpisode = episodes[episodes.length - 1];

          show.lastUpdatedAt = new Date(lastEpisode.publishedAt);
        });

        response.sort((a, b) => {
          return (
            (b.lastUpdatedAt?.getTime() ?? 0) -
            (a.lastUpdatedAt?.getTime() ?? 0)
          );
        });

        const index = new Fuse(response, {
          keys: ["title"],
          isCaseSensitive: false,
        });

        setSearchIndex(index);
        setShows(response);
        setSearchResults(response);
        updateShowModal(response);
      })
      .catch(console.error);
  }, []);

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
    } else {
      setModalShow(undefined);
    }
  };

  const updateShowModal = useCallback(
    (_shows?: ShowArray) => {
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
      <div
        style={{
          position: "sticky",
          top: "0",
          left: "0",
          zIndex: 49,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        {
          <div
            className="w-[300px] max-w-[80%] mx-auto"
            style={{
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
              show={metadata}
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
                    <div className="w-[300px] mt-5">
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

                  {modalShow.show.season[
                    modalShow.selectedSeason
                  ]?.episodes.map((ep) => {
                    return (
                      <ShowCard
                        key={ep.id}
                        show={ep}
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
