/* eslint-disable prettier/prettier */
import type { ShowMap } from "./src/types/index";

import fs, { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import 'dotenv/config'

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const CHANNEL_ID = "UCPDXXXJj9nax0fr0Wfc048g";
const dataFolder = "data";
const manualEpisodeMap = {
  WbH_QVzRgy8: 1,
  PLZZlILTF3M: 1,
  BetBI4f6MpU: 7,
  vvE7Yuk5lP8: 21,
  Myo_5KYx_YI: 1,
  j6s4gg0KKFs: -3,
  "DYXEhEW-3mk": 1,
  "-ulIYMA0sqg": 19,
  "ck1JW-_G2Yc": 1,
  s5_JVmcDK5c: 2,
  a0nBDwBFPI4: 3,
  hdQKi3wf_zw: -3,
  d7HNkywItkU: 7,
  wzQDifGMnPE: 1,
  "3aZVgyUlSng": 1,
  oVEMU6j2ZPg: 2,
  RQSyTzmsavs: 6,
  powei5k8GR0: 13,
  p7x6EzePaeg: 14,
  pURrup121Xk: 1,
  "99LdpMvIDQ8": 2,
  AY8VqiswElI: 3,
  In5nQnYXeVg: 4,
  "xn9wwrs-JXU": 5,
  "2PsUg2RWiA4": 6,
  sig8X_kojco: 7,
  Ckox3W4zRHc: 8,
  sCtIeSyWFn8: 9,
  BTIG9oydjGQ: 10,
  P8U22JoOyUQ: 11,
  upuuZk6QlV8: 12,
  RGb2VYNd4ws: 13,
  "63tcD2_hhHU": 14,
  "6qnmkuz8H9s": 15,
  ML5m4NL8meE: 16,
  ozQa0im0C5I: 17,
  FnXSQiR8ayU: 18,
  "FC4ZTM0ou-0": -2,
  wZcyv12V5ME: 1,
  "50cLTrOR-Ag": 2,
  "WvCcR-DMLZc": 3,
  "4WS23aWnGgA": 4,
  puT6xVIsCuQ: 5,
  r0c1n35WySE: 6,
  Ai17lla31aU: -4,
  FfUHiMnkNoQ: -4,
  VLwPItrMW9M: -4,
  hnHhTAvbqlU: -3,
  qmRyK1xrlI4: -4,
  "6G1f5PJjq6o": 2,
  "12HXd74txLw": 1,
  ehpmyxH3PLA: 2,
  Br9bUTdKu0U: 3,
  lfv2slVWSRs: 4,
  qMQR_ez7lyE: 5,
  "40aicHJaCAQ": 6,
  "PC-bAvWw2RY": 7,
  "8v31H7xse5Q": 8,
  "7SxJsbN64sQ": 10,
  "4SoHQSNfOuI": 13,
  E4ofpttqMms: 15,
  fz3ayyI1kiU: 16,
  i5yDgJjfe5w: 17,
  L7vkadQZbeE: 18,
  N66TQDa7ym0: 19,
  "vfrRKA2-OJo": 22,
  HnsKu2E3_Xw: 23,
  Mu9WENJ2zqo: 24,
  MSOy6Sp24k4: 25,
  OsMisAQ74Q0: -4,
  "0RKtX6u4DnM": -4,
  PezIGhC2hGI: -4,
  hwGXwcz3TDI: -4,
  OMgdC8HDOZ0: -4,
  n77kSA7rNa8: -4,
  TDIl5e_0jYk: -4,
  uMTGOlQ8FNY: -4,
  "0gGCcEvk3xI": -4,
  z_63RrmPHGw: -4,
  c38FM75jOwI: -4,
  "aVW-OQxPWI": -4,
  "4nnkns2w8tU": -4,
  "vaVW-OQxPWI": -4,
  ZsZjFAfJJ3c: 1,
  "3yQYVRzuP7M": 11,
  qNGk80rTvOs: 19,
  "2acQ6-gb2tE": 7,
  "-F1oAsEWQ4Q": 9,
  "6xcd7vfjo0o": -4,
  "-OcNWYpthsM": -4,
  "USDoNZ-Ygdc": 20,
  "7rjNgO-YUos": -4,
  Sr0Zi59jpEc: -4,
  "z2sn-g35LFQ": 25,
};

async function fetchPlaylists(pageToken = "") {
  const baseUrl = "https://www.googleapis.com/youtube/v3/playlists";
  const params = new URLSearchParams({
    part: "snippet",
    channelId: CHANNEL_ID,
    maxResults: "50",
    key: API_KEY,
  });
  if (pageToken) params.append("pageToken", pageToken);

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  const data = await response.json();

  if (!data.items) {
    console.error("Failed to fetch playlists:", data);
    return [];
  }

  const playlists = data.items;

  if (data.nextPageToken) {
    const nextPage = await fetchPlaylists(data.nextPageToken);
    return playlists.concat(nextPage);
  }

  return playlists;
}

async function savePlaylistData() {
  const playlists = await fetchPlaylists();

  writeFileSync(
    join(__dirname, dataFolder, "playlists", "index.json"),
    JSON.stringify(playlists, null, 2)
  );
}

async function getPlaylistVideos(
  playlistId: string,
  pageToken = "",
  allVideos: any[] = []
) {
  const params = new URLSearchParams({
    key: API_KEY,
    part: "snippet",
    maxResults: "50",
    playlistId,
    pageToken,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
  );
  const data = await res.json();

  if (!res.ok) throw new Error(JSON.stringify(data));

  const items = (data.items as any[]) || [];
  allVideos.push(...items);

  if (data.nextPageToken) {
    return getPlaylistVideos(playlistId, data.nextPageToken, allVideos);
  }

  return allVideos;
}

async function getAllPlaylistsVideos() {
  const playlists = JSON.parse(
    fs.readFileSync(
      join(__dirname, dataFolder, "playlists", "index.json"),
      "utf-8"
    )
  );

  await Promise.all(
    playlists.map(async (playlist: any) => {
      const videos = await getPlaylistVideos(playlist.id);

      console.log(
        `Fetched ${videos.length} videos for playlist: ${playlist.snippet.title}`
      );

      writeFileSync(
        join(__dirname, dataFolder, "playlists", `${playlist.id}.json`),
        JSON.stringify(videos, null, 2)
      );
    })
  );
}

async function getAdventuringPartySeasonOne() {
  const playlistId = "PLObfuAmZm9pDMHtb0drlb8b6hC3FG_A5r";
  const videos = await getPlaylistVideos(playlistId);

  return videos.splice(0, 18);
}

async function getBreakingNewsSeasonOne() {
  const playlistId = "PLuKg-WhduhknGP5ykvcU-40Pxp-aPQZho";
  const videos = await getPlaylistVideos(playlistId);

  return videos.splice(1, 4);
}

async function polyfillMissingShows(shows: ShowMap) {
  shows["Breaking News"].season[1] = {
    id: "PLuKg-WhduhknGP5ykvcU-40Pxp-aPQZho",
    episodes: getEpisodes(await getBreakingNewsSeasonOne()),
  };

  shows["Adventuring Academy"].season["1"] = {
    id: "PLObfuAmZm9pDMHtb0drlb8b6hC3FG_A5r",
    episodes: getEpisodes(await getAdventuringPartySeasonOne()),
  };
}

function parseTitle(title: string) {
  const episodeTitle = title.split("|")[0];
  let episodeNumber = parseInt(title.toLowerCase().split("ep.")[1]);

  if (
    isNaN(episodeNumber) &&
    title.toLowerCase().includes("behind the scenes")
  ) {
    episodeNumber = -3;
  }

  if (isNaN(episodeNumber) && title.toLowerCase().includes("last looks")) {
    episodeNumber = -4;
  }

  if (isNaN(episodeNumber) && title.toLowerCase().includes("trailer")) {
    episodeNumber = -2;
  }

  return {
    epNumber: episodeNumber,
    epTitle: episodeTitle,
  };
}

function getEpisodes(playlistData: any) {
  const episodes = playlistData
    .filter(({ snippet }) => snippet.title !== "Private video")
    .map((video) => {
      let { epTitle, epNumber } = parseTitle(video.snippet.title);

      if (isNaN(epNumber)) {
        if (
          epTitle.toLowerCase().includes("teaser") ||
          epTitle.toLowerCase().includes("trailer")
        ) {
          epNumber = -2;
        } else {
          epNumber = -1;
        }
      }

      const videoId = video.snippet.resourceId.videoId;

      if (videoId in manualEpisodeMap) {
        epNumber = manualEpisodeMap[videoId];
      }

      return {
        thumbnails: video.snippet.thumbnails.maxres,
        publishedAt: video.snippet.publishedAt,
        title: epTitle.trim(),
        number: epNumber,
        id: videoId,
      };
    }) as any[];

  return episodes;
}

async function getVideoDetails(videoIds: string[]) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(
      ","
    )}&key=${API_KEY}`
  );

  const data = await response.json();

  data.items.forEach((item) => {
    item.snippet.resourceId = {
      videoId: item.id,
    };

    return item;
  });

  return getEpisodes(data.items);
}

async function extractShowInfo() {
  const playlists = JSON.parse(
    fs.readFileSync(
      join(__dirname, dataFolder, "playlists", "index.json"),
      "utf-8"
    )
  );

  const shows: ShowMap = {};

  const transforms = [
    {
      condition: (title: string) =>
        title.toLowerCase().includes("fantasy high") ||
        title.toLowerCase().replaceAll(":", "").includes("dimension 20 live"),
      transform() {
        return "Dimension 20: Fantasy High";
      },
      getSeason(title: string): number {
        if (title.toLowerCase().includes("live")) {
          return 2;
        }

        if (title.toLowerCase().includes("fantasy high junior year")) {
          return 3;
        }

        return 1;
      },
    },
    {
      condition: (title: string) => title.includes("Um Actually"),
      transform: (title: string) =>
        title.replace("Um Actually", "Um, Actually"),
    },
    {
      condition: (title: string) => {
        return (
          title.toLowerCase().includes("adventuring") &&
          title.toLowerCase().includes("party")
        );
      },
      transform: () => "Dimension 20's Adventuring Party",
    },
    {
      condition: (title: string) =>
        title.toLowerCase().includes("breaking news"),
      transform: () => "Breaking News",
    },
    {
      condition: (title: string) =>
        title.toLowerCase().includes("dimension 20: the unsleeping city"),
      transform: () => "Dimension 20: The Unsleeping City",
    },
    {
      condition: (title: string) =>
        title.toLowerCase().includes("misfits and magic"),
      transform: () => "Dimension 20: Misfits and Magic",
    },
  ];

  for (const playlist of playlists) {
    const { id, snippet } = playlist;
    const { title } = snippet;
    const lowercaseTitle = title.toLowerCase();

    const playlistData = JSON.parse(
      readFileSync(
        join(__dirname, dataFolder, "playlists", `${id}.json`),
        "utf-8"
      )
    );

    if (!lowercaseTitle.includes("(full episodes)")) continue;

    if (title.includes(" Season")) {
      let [showName, seasonString] = title.split(" Season");

      let seasonNumber = -1;

      for (const transform of transforms) {
        const conditionFn = transform.condition;

        if (conditionFn(showName)) {
          showName = transform.transform(showName);

          if ("getSeason" in transform) {
            seasonNumber = transform.getSeason!(title);
          }
        }
      }

      showName = showName.replaceAll(":", "");

      if (seasonNumber === -1) {
        seasonNumber = parseInt(seasonString.trim(), 10);
      }

      if (!(showName in shows)) {
        shows[showName] = {
          title: showName,
          thumbnail:
            playlist.snippet.thumbnails.maxres ??
            playlist.snippet.thumbnails.standard,
          season: {},
        };
      }

      shows[showName].season[seasonNumber] = {
        id,
        episodes: getEpisodes(playlistData),
      };
    } else {
      let showName = title.replace("(Full Episodes)", "").trim();
      let seasonNumber = -1;

      for (const transform of transforms) {
        const conditionFn = transform.condition;

        if (conditionFn(showName)) {
          showName = transform.transform(showName);

          if ("getSeason" in transform) {
            seasonNumber = transform.getSeason!(title);
          }
        }
      }

      showName = showName.replaceAll(":", "");

      if (seasonNumber === -1) {
        seasonNumber = 1;
      }

      if (!(showName in shows)) {
        shows[showName] = {
          title: showName,
          thumbnail:
            playlist.snippet.thumbnails.maxres ??
            playlist.snippet.thumbnails.standard,
          season: {},
        };
      }

      shows[showName].season[seasonNumber] = {
        id,
        episodes: getEpisodes(playlistData),
      };
    }
  }

  await polyfillMissingShows(shows);
  const showArray = Object.entries(shows).map(([, show]) => show);

  if (shows["Dimension 20 Animated"]) {
    shows["Dimension 20 Animated"].season["1"].episodes.reverse();
  }

  if (shows["Breaking News"]) {
    const videos = await getVideoDetails([
      "fz3ayyI1kiU",
      "i5yDgJjfe5w",
      "L7vkadQZbeE",
      "N66TQDa7ym0",
    ]);

    shows["Breaking News"].season[3].episodes.push(...videos);
    shows["Breaking News"].season[3].episodes.sort((a, b) => {
      return a.number - b.number;
    });
  }

  if (shows["Dimension 20's Adventuring Party"]) {
    shows["Dimension 20's Adventuring Party"].season["1"].episodes.forEach(
      (ep) => {
        if (ep.number >= 10) {
          ep.number += 1;
        }
      }
    );

    const ep = shows["Dimension 20's Adventuring Party"].season[
      "1"
    ].episodes.find((ep) => {
      return ep.id === "kZy0mmTLf_g";
    });

    if (ep) {
      ep.number = 10;
    }

    shows["Dimension 20's Adventuring Party"].season["1"].episodes.sort(
      (a, b) => {
        return a.number - b.number;
      }
    );
  }

  if (shows["Adventuring Academy"]) {
    const adventuringAcademy = shows["Adventuring Academy"];

    adventuringAcademy.season["2"].episodes.sort((a, b) => {
      return a.number - b.number;
    });

    adventuringAcademy.season["3"].episodes.sort((a, b) => {
      return a.number - b.number;
    });
  }

  writeFileSync(
    join(__dirname, "src", "shows.json"),
    JSON.stringify(showArray, null, 2)
  );
}

function createDataDirectory() {
  const dataPath = join(__dirname, dataFolder);

  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
  }

  const playlistsPath = join(dataPath, "playlists");

  if (!fs.existsSync(playlistsPath)) {
    fs.mkdirSync(playlistsPath);
  }
}

createDataDirectory();
await savePlaylistData();
await getAllPlaylistsVideos();
extractShowInfo();
