import { get } from "./client";
export type TagsResponse = { tags: string[] };
export const fetchTags = (nsfw_ok = false) => get<TagsResponse>("/tags", { nsfw_ok });
