import { BookStatus, BookType } from 'common/enums';

export interface BookEntity {
  bookId: string;
  bookName: string;
  bookAuthor?: string;
  bookTranslator?: string;
  bookPress?: string;
  bookEdition?: string;
  bookIsbn: string;
  bookIssueCode?: string;
  bookIssueCodeForeign?: string;
  bookIssueNumber?: string;
  bookIssueTotal?: number;
  bookPrice: number;
  bookType: BookType;
  bookStatus: BookStatus;
}
