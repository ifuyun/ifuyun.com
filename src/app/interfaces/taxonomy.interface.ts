import { TaxonomyStatus, TaxonomyType } from '../config/common.enum';

export interface TaxonomyEntity {
  taxonomyId: string;
  taxonomyType: TaxonomyType;
  taxonomyName: string;
  taxonomySlug: string;
  taxonomyDescription?: string;
  taxonomyIcon?: string;
  taxonomyParent?: string;
  taxonomyStatus?: TaxonomyStatus;
  objectCount?: number;
}

export interface TaxonomyNode extends TaxonomyEntity {
  children?: TaxonomyNode[];
  isLeaf?: boolean;
}
