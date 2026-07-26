import { Injectable } from '@angular/core';
import { ApiService, ApiUrl, AppConfigService, HttpResponseEntity, ResultList, URL_AVATAR_API } from 'common/core';
import { CommentTargetType } from 'common/enums';
import { Comment, CommentDto } from 'common/interfaces';
import { format } from 'common/utils';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { IpService } from './ip.service';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private targetId: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public targetId$: Observable<string> = this.targetId.asObservable();

  constructor(
    private readonly apiService: ApiService,
    private readonly ipService: IpService,
    private readonly appConfigService: AppConfigService
  ) {}

  updateTargetId(targetId: string) {
    this.targetId.next(targetId);
  }

  getCommentsByPostId(param: { postId: string; page: number; size: number }): Observable<ResultList<Comment>> {
    const { postId, page, size } = param;

    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        targetId: postId,
        page,
        size,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByWallpaperId(param: {
    wallpaperId: string;
    page: number;
    size: number;
  }): Observable<ResultList<Comment>> {
    const { wallpaperId, page, size } = param;

    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        targetId: wallpaperId,
        page,
        size,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByGameId(param: { gameId: string; page: number; size: number }): Observable<ResultList<Comment>> {
    const { gameId, page, size } = param;

    return this.apiService
      .httpGet(ApiUrl.COMMENTS, {
        targetId: gameId,
        page,
        size,
        appId: this.appConfigService.appId
      })
      .pipe(map((res) => res?.data || {}));
  }

  getCommentsByTargetId(param: {
    targetId: string;
    targetType: CommentTargetType;
    page: number;
    size: number;
  }): Observable<ResultList<Comment>> {
    const { targetId, targetType, page, size } = param;

    if (targetType === CommentTargetType.POST) {
      return this.getCommentsByPostId({
        postId: targetId,
        page,
        size
      });
    } else if (targetType === CommentTargetType.GAME) {
      return this.getCommentsByGameId({
        gameId: targetId,
        page,
        size
      });
    }
    return this.getCommentsByWallpaperId({
      wallpaperId: targetId,
      page,
      size
    });
  }

  saveComment(comment: CommentDto): Observable<HttpResponseEntity> {
    return this.apiService.httpPost(
      ApiUrl.COMMENT,
      {
        ...comment,
        appId: this.appConfigService.appId
      },
      true
    );
  }

  transformComments(comments: Comment[], avatarType: string): Comment[] {
    return comments.map((item) => {
      return {
        ...item,
        idHash: item.id.substring(4, 10),
        userName: item.user?.nickname || item.userName,
        userAvatar:
          item.user?.avatarUrl || format(URL_AVATAR_API, item.user?.emailHash || item.userEmailHash, avatarType),
        userLocation: this.ipService.getIPLocation(item.ipInfo),
        depth: 1,
        isLeaf: true,
        parent: item.parent
          ? {
              ...item.parent,
              idHash: item.parent.id.substring(4, 10),
              userName: item.parent.user?.nickname || item.parent.userName || '匿名用户'
            }
          : undefined,
        children: []
      };
    });
  }

  initCommentTree(comments: Comment[]) {
    const map = new Map<string, Comment>();

    comments.forEach((item) => {
      map.set(item.id, item);
    });

    const roots: Comment[] = [];

    comments.forEach((item) => {
      const node = map.get(item.id)!;
      const parent = item.parentId ? map.get(item.parentId) : null;

      if (!parent) {
        roots.push(node);
      } else {
        parent.children.push(node);
      }
    });

    return roots;
  }

  flattenChildComments(node: Comment, depth: number) {
    const result: Comment[] = [];
    const walk = (n: Comment) => {
      if (n.children.length < 1) {
        return;
      }
      for (const child of n.children) {
        result.push({
          ...child,
          children: [],
          depth,
          isLeaf: true
        });
        walk(child);
      }
    };

    walk(node);

    return result.sort((a, b) => {
      return a.createdAt > b.createdAt ? 1 : -1;
    });
  }

  buildCommentTree(params: { comments: Comment[]; depth: number; avatarType: string }) {
    const { comments, depth, avatarType } = params;
    const tree = this.initCommentTree(this.transformComments(comments, avatarType));
    const transform = (nodes: Comment[], curDepth: number) => {
      for (const node of nodes) {
        node.depth = curDepth;
        if (node.children.length) {
          if (curDepth < depth - 1) {
            node.children = transform(node.children, curDepth + 1);
          } else {
            node.children = this.flattenChildComments(node, depth);
          }
          node.isLeaf = node.children.length < 1;
        }
      }

      return nodes.sort((a, b) => {
        return a.createdAt > b.createdAt ? 1 : -1;
      });
    };

    for (const node of tree) {
      node.children = transform(node.children, 2);
      node.isLeaf = node.children.length < 1;
    }

    return tree;
  }
}
