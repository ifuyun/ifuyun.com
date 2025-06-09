import { BookStatus, BookType } from 'common/enums';

export interface BookEntity {
  bookId: string;
  bookName: string;
  bookAuthor?: string;
  bookTranslator?: string;
  bookPress?: string;
  bookEdition?: string;
  bookIsbn: string;
  bookPostCode?: string;
  bookPostCodeForeign?: string;
  bookIssue?: string;
  bookIssueTotal?: number;
  bookPrice: number;
  bookType: BookType;
  bookStatus: BookStatus;
}
