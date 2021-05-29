export interface ChapterResults {
  results: ChapterResult[];
  limit: number;
  offset: number;
  total: number;
}

export interface ChapterResult {
  result: ResultEnum;
  data: Data;
  relationships: Relationship[];
}

export interface Data {
  id: string;
  type: DataType;
  attributes: Attributes;
}

export interface Attributes {
  volume: string;
  chapter: string;
  title: string;
  translatedLanguage: TranslatedLanguage;
  hash: string;
  data: string[];
  dataSaver: string[];
  publishAt: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export enum TranslatedLanguage {
  En = "en",
}

export enum DataType {
  Chapter = "chapter",
}

export interface Relationship {
  id: string;
  type: RelationshipType;
}

export enum RelationshipType {
  Manga = "manga",
  ScanlationGroup = "scanlation_group",
  User = "user",
}

export enum ResultEnum {
  Ok = "ok",
}
