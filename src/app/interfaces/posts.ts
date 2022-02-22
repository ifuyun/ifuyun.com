export interface Post {
  postId: string;
  postTitle: string;
  postGuid: string;
}

export interface PostArchiveDate {
  dateText: string;
  dateTitle: string;
  count?: number;
}
