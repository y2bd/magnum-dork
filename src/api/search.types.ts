export interface SearchResults {
  results: SearchResult[];
  limit: number;
  offset: number;
  total: number;
}

export interface SearchResult {
  result: ResultEnum;
  data: Data;
  relationships: Relationship[];
}

export interface Data {
  id: string;
  type: DataType;
  attributes: DataAttributes;
}

export interface DataAttributes {
  title: Description;
  altTitles: Description[];
  description: Description;
  isLocked: boolean;
  links: Links;
  originalLanguage: OriginalLanguage;
  lastVolume: null | string;
  lastChapter: string;
  publicationDemographic: null | string;
  status: Status;
  year: null;
  contentRating: ContentRating;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface Description {
  en: string;
}

export enum ContentRating {
  Safe = "safe",
  Suggestive = "suggestive",
}

export interface Links {
  al: string;
  ap: string;
  kt: string;
  mu: string;
  nu?: string;
  mal: string;
  raw?: string;
  engtl?: string;
  bw?: string;
  amz?: string;
  cdj?: string;
  ebj?: string;
  dj?: string;
}

export enum OriginalLanguage {
  Ja = "ja",
  Ko = "ko",
}

export enum Status {
  Ongoing = "ongoing",
}

export interface Tag {
  id: string;
  type: TagType;
  attributes: TagAttributes;
}

export interface TagAttributes {
  name: Description;
  description: any[];
  group: Group;
  version: number;
}

export enum Group {
  Content = "content",
  Format = "format",
  Genre = "genre",
  Theme = "theme",
}

export enum TagType {
  Tag = "tag",
}

export enum DataType {
  Manga = "manga",
}

export interface Relationship {
  id: string;
  type: RelationshipType;
}

export enum RelationshipType {
  Artist = "artist",
  Author = "author",
  CoverArt = "cover_art",
}

export enum ResultEnum {
  Ok = "ok",
}
