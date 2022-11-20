export interface LinkEntity {
  linkUrl: string;
  linkName: string;
  linkImage: string;
  linkTarget: string;
  linkDescription: string;
  linkRss: string;
}

export interface FavoriteLink {
  taxonomyId: string;
  taxonomyName: string;
  taxonomySlug: string;
  taxonomyDescription: string;
  taxonomyParent: string;
  taxonomyOrder: number;
  links: LinkEntity[];
}
