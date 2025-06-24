/* eslint-disable prettier/prettier */
import { Dexie, type EntityTable } from "dexie";

interface Favourites {
  showName: string;
  addedAt: number;
}

interface SelectedSeason {
  showName: string;
  season: number;
}

interface Settings {
  key: string;
  value: unknown;
}

interface WatchedEpisodes {
  showName: string;
  episodeId: string;
}

export const db = new Dexie("dropout_shows") as Dexie & {
  favourites: EntityTable<Favourites, "showName">;
  selectedSeason: EntityTable<SelectedSeason, "showName">;
  settings: EntityTable<Settings, "key">;
  watchedEpisodes: EntityTable<WatchedEpisodes, "showName">;
};

db.version(1).stores({
  favourites: "showName,addedAt",
  selectedSeason: "showName",
  settings: "key",
  watchedEpisodes: "[showName+episodeId]",
});

class DropoutStorage {
  static async addFavourite(showName: string): Promise<void> {
    const currentTimestamp = Date.now();
    await db.favourites.put({ showName, addedAt: currentTimestamp });
  }

  static async removeFavourite(showName: string): Promise<void> {
    await db.favourites.delete(showName);
  }

  static async getFavourites(): Promise<Set<string>> {
    return new Set(
      (await db.favourites.orderBy("addedAt").toArray()).map(
        (fav) => fav.showName
      )
    );
  }

  static async addSelectedSeason(
    showName: string,
    season: number
  ): Promise<void> {
    await db.selectedSeason.put({
      showName,
      season,
    });
  }

  static async getSelectedSeason(
    showName: string
  ): Promise<string> {
    const show = await db.selectedSeason.get(showName);
    return show?.season.toString() ?? "";
  }

  static async getSettings(key: string): Promise<unknown> {
    const setting = await db.settings.get(key);
    return setting?.value;
  }

  static async setSettings(key: string, value: unknown): Promise<void> {
    await db.settings.put({ key, value });
  }

  static async addWatchedEpisode(
    showName: string,
    episodeId: string
  ): Promise<void> {
    await db.watchedEpisodes.put({ showName, episodeId });
  }

  static async removeWatchedEpisode(
    showName: string,
    episodeId: string
  ): Promise<void> {
    await db.watchedEpisodes
      .where(["showName", "episodeId"])
      .equals([showName, episodeId])
      .delete();
  }

  static async addBulkWatchedEpisodes(
    showName: string,
    episodeIds: string[]
  ): Promise<void> {
    const watchedEpisodes = episodeIds.map((episodeId) => ({
      showName,
      episodeId,
    }));
    await db.watchedEpisodes.bulkPut(watchedEpisodes);
  }

  static async removeBulkWatchedEpisodes(
    showName: string,
    episodeIds: string[]
  ): Promise<void> {
    const watchedEpisodes = episodeIds.map((episodeId) => ({
      showName,
      episodeId,
    }));
    await db.watchedEpisodes.bulkDelete(
      // @ts-expect-error this is fine
      watchedEpisodes.map((we) => [we.showName, we.episodeId])
    );
  }

  static async hasEpisodeBeenWatched(
    showName: string,
    episodeId: string
  ): Promise<boolean> {
    const watched = await db.watchedEpisodes.get({ showName, episodeId });
    return watched !== undefined;
  }

  static async getWatchedEpisodes(): Promise<Set<string>> {
    return new Set(
      (await db.watchedEpisodes.toArray()).map((watched) => {
        return watched.episodeId;
      })
    );
  }
}

export default DropoutStorage;
