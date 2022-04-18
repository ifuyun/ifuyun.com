export interface TaxonomyEntity {
  taxonomyName: string;
  taxonomyDescription?: string;
  taxonomySlug: string;
  taxonomyId: string;
  taxonomyParent?: string;
  taxonomyStatus?: number;
  objectCount?: number;
}

export interface TaxonomyNode extends TaxonomyEntity {
  children?: TaxonomyNode[];
  isLeaf?: boolean;
}
