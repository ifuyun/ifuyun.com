export interface TaxonomyEntity {
  name: string;
  description?: string;
  slug: string;
  taxonomyId: string;
  parentId?: string;
  status?: number;
  count?: number;
}

export interface TaxonomyNode extends TaxonomyEntity {
  children?: TaxonomyNode[];
  isLeaf?: boolean;
}
