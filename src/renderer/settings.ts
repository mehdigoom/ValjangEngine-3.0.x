import * as fs from "fs";

export let corePath: string;
export let userDataPath: string;

export let favoriteServers: ServerEntry[];
export let favoriteServersById: { [id: string]: ServerEntry };

export let recentProjects: { host: string; projectId: string; name: string; }[];
export let autoStartServer: boolean;

export let nickname: string;
export let presence: "online" | "away" | "offline";
export let savedChatrooms: string[];

export function setPaths(newCorePath: string, newUserDataPath: string) {
  corePath = newCorePath;
  userDataPath = newUserDataPath;
}

export function setNickname(newNickname: string) {
  nickname = newNickname;
}

export function setPresence(newPresence: "online" | "away" | "offline") {
  presence = newPresence;
}

export function setSavedChatrooms(newSavedChatrooms: string[]) {
  savedChatrooms = newSavedChatrooms;
}

export function setAutoStartServer(enabled: boolean) {
  autoStartServer = enabled;
}

export function load(callback: (err: Error) => void) {
  const settingsPath = `${userDataPath}/settings.json`;
  console.log(`Loading settings from ${settingsPath}!!!!`);

  fs.readFile(settingsPath, { encoding: "utf8" }, (err, dataJSON) => {
    if (err != null && err.code !== "ENOENT") {
      callback(err);
      return;
    }

    favoriteServersById = {};
    favoriteServers = [];
    recentProjects = [];

    if (dataJSON == null) {
      // Setup defaults
      autoStartServer = true;

      nickname = null;
      presence = "offline";
      savedChatrooms = [];

      callback(null);
      return;
    }

    const data = JSON.parse(dataJSON);
    favoriteServers = data.favoriteServers;

    let nextServerId = 0;
    for (const entry of favoriteServers) {
      entry.id = (nextServerId++).toString();
      favoriteServersById[entry.id] = entry;
      if (entry.password == null) entry.password = "";
    }
    recentProjects = data.recentProjects;
    autoStartServer = data.autoStartServer;

    nickname = data.nickname;
    presence = data.presence;
    savedChatrooms = data.savedChatrooms;

    callback(null);
  });
}

let scheduleSaveTimeoutId: NodeJS.Timer;
export function scheduleSave() {
  if (scheduleSaveTimeoutId != null) return;
  scheduleSaveTimeoutId = setTimeout(applyScheduledSave, 30 * 1000);
}

export function applyScheduledSave() {
  if (scheduleSaveTimeoutId == null) return;

  const savedFavoriteServers: { hostname: string; port: string; label: string; password: string; }[] = [];

  for (const entry of favoriteServers) {
    savedFavoriteServers.push({ hostname: entry.hostname, port: entry.port, label: entry.label, password: entry.password });
  }

  const data = {
    favoriteServers: savedFavoriteServers,
    recentProjects,
    autoStartServer,
    nickname,
    presence,
    savedChatrooms
  };

  fs.writeFileSync(`${userDataPath}/settings.json`, JSON.stringify(data, null, 2) + "\n", { encoding: "utf8" });

  clearTimeout(scheduleSaveTimeoutId);
  scheduleSaveTimeoutId = null;
}
