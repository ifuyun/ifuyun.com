import { BookType } from 'common/enums';

export interface BookEntity {
  id: string;
  name: string;
  author: string;
  translator: string;
  press: string;
  edition: string;
  isbn: string;
  postCode: string;
  postCodeForeign: string;
  issue: string;
  issueTotal: number;
  price?: number;
  type: BookType;
}
