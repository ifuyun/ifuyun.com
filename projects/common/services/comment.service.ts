import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity, ResultList, URL_AVATAR_API } from 'common/core';
import { CommentObjectType } from 'common/enums';
import { Comment, CommentEntity, MetaData } from 'common/interfaces';
import { format } from 'common/utils';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { IpService } from './ip.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private objectId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public objectId$: Observable<string> = this.objectId.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly ipService: IpService,
    private readonly appConfigService: AppConfigService
  ) {}

  updateObjectId(objectId: string) {
    this.objectId.next(objectId);
  }

  getCommentsByPostId(postId: string): Observable<ResultList<Comment>> {
    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        objectId: postId,
        objectType: CommentObjectType.POST,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByWallpaperId(wallpaperId: string): Observable<ResultList<Comment>> {
    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        objectId: wallpaperId,
        objectType: CommentObjectType.WALLPAPER,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByGameId(gameId: string): Observable<ResultList<Comment>> {
    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        objectId: gameId,
        objectType: CommentObjectType.GAME,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByObjectId(objectId: string, objectType: CommentObjectType): Observable<ResultList<Comment>> {
    if (objectType === CommentObjectType.POST) {
      return this.getCommentsByPostId(objectId);
    } else if (objectType === CommentObjectType.GAME) {
      return this.getCommentsByGameId(objectId);
    }
    return this.getCommentsByWallpaperId(objectId);
  }

  saveComment(comment: CommentEntity): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.COMMENT,
      {
        ...comment,
        appId: this.appConfigService.appId
      },
      true
    );
  }

  generateCommentTree(comments: Comment[], threadDepth: number) {
    const copies = [...comments];
    let tree = copies.filter((father) => {
      father.children = copies.filter((child) => {
        if (father.commentId === child.commentParent) {
          // 不能直接赋值，否则会循环引用
          child.parent = { ...father };
          return true;
        }
        return false;
      });
      father.isLeaf = father.children.length < 1;
      return father.commentParent === father.commentTop;
    });
    const flattenIterator = (nodes: Comment[], list: Comment[]) => {
      for (const node of nodes) {
        list.push({ ...node, isLeaf: true, level: threadDepth, children: [] });
        if (node.children.length > 0) {
          flattenIterator(node.children, list);
        }
      }
      return list;
    };
    const iterator = (nodes: Comment[], level: number) => {
      if (threadDepth === 2) {
        nodes = flattenIterator(nodes, []).sort((a, b) => (a.commentCreated > b.commentCreated ? 1 : -1));
      } else {
        nodes.forEach((node) => {
          node.level = level;
          if (node.children.length > 0) {
            if (level < threadDepth - 1) {
              node.children = iterator(node.children, level + 1);
            } else {
              node.children = flattenIterator(node.children, []).sort((a, b) => {
                return a.commentCreated > b.commentCreated ? 1 : -1;
              });
            }
          }
        });
      }
      return nodes;
    };
    tree = iterator(tree, 2);

    return tree;
  }

  transformComments(comments: Comment[], threadDepth: number, avatarType: string) {
    const initialFn = (comment: Comment) => {
      comment.commentHash = comment.commentId.substring(4, 10);
      comment.commentAuthor = comment.user?.userNickname || comment.authorName;
      comment.authorAvatar =
        comment.user?.userAvatar ||
        format(URL_AVATAR_API, comment.user?.userEmailHash || comment.authorEmailHash, avatarType);
      comment.commentMetaMap = this.transformMeta(comment.commentMeta || []);
      comment.userLocation = this.ipService.getIPLocation(comment.ipInfo);
    };

    comments.forEach((comment) => {
      comment.level = 1;
      initialFn(comment);
      comment.children.forEach((item) => initialFn(item));

      comment.children = this.generateCommentTree(comment.children, threadDepth);
      comment.children.forEach((child) => (child.parent = cloneDeep(comment)));
    });

    return comments;
  }

  transformMeta(meta: MetaData[]): Record<string, string> {
    const result: Record<string, string> = {};
    meta.forEach((item) => (result[item.metaKey] = item.metaValue));

    return result;
  }
}
