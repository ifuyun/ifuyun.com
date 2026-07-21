export interface LinkVo {
  id: string;
  name: string;
  url: string;
  description: string;
  imageUrl?: string;
  target: string;
  isExternal: boolean;
}

export interface FavoriteLink {
  catId: string;
  catName: string;
  catSlug: string;
  catDescription: string;
  catParentId: string | null;
  catSort: number;
  links: LinkVo[];
}
