import { sfetch } from "../utils/sfetch";

export function atHomeUrl(chapterId: string) {
  const url = new URL(
    `https://restless-mode-a980.arewecoolyet.workers.dev/at-home/server/${chapterId}`
  );
  return sfetch(url.toString())
    .then((response) => response.json())
    .then((response) => response.baseUrl as string);
}
