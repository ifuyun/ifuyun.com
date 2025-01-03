import { Injectable } from '@angular/core';
import { BookType } from '../enums/book';
import { BookEntity } from '../interfaces/book';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  getBookName(book?: BookEntity, withMark = true) {
    let shortName = '';
    let fullName = '';

    if (!book) {
      return {
        shortName,
        fullName
      };
    }
    if ([BookType.BOOK, BookType.OTHER].includes(book.bookType)) {
      shortName = fullName = withMark ? `《${book.bookName}》` : book.bookName;
    }
    if (withMark) {
      fullName = `《${book.bookName}》${book.bookIssueNumber ? '（' + book.bookIssueNumber + '）' : ''}`;
    } else {
      fullName = `${book.bookName}${book.bookIssueNumber ? '（' + book.bookIssueNumber + '）' : ''}`;
    }
    shortName = book.bookIssueNumber || book.bookName;

    return {
      shortName,
      fullName
    }
  }
}
