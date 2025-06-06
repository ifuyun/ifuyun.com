import { Injectable } from '@angular/core';
import { BookType } from 'common/enums';
import { BookEntity } from 'common/interfaces';

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
      fullName = `《${book.bookName}》${book.bookIssue ? '（' + book.bookIssue + '）' : ''}`;
    } else {
      fullName = `${book.bookName}${book.bookIssue ? '（' + book.bookIssue + '）' : ''}`;
    }
    shortName = book.bookIssue || book.bookName;

    return {
      shortName,
      fullName
    };
  }
}
