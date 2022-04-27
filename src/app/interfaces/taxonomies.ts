export interface TaxonomyEntity {
  taxonomyName: string;
  taxonomySlug: string;
  taxonomyDescription?: string;
  taxonomyIcon?: string;
  taxonomyId: string;
  taxonomyParent?: string;
  taxonomyStatus?: number;
  objectCount?: number;
}

export interface TaxonomyNode extends TaxonomyEntity {
  children?: TaxonomyNode[];
  isLeaf?: boolean;
}
