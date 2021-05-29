import { sfetch } from "../utils/sfetch";

export function atHomeUrl(chapterId: string) {
  const url = new URL(`https://api.mangadex.org/at-home/server/${chapterId}`);
  return sfetch(url.toString())
    .then((response) => response.json())
    .then((response) => response.baseUrl as string);
}
