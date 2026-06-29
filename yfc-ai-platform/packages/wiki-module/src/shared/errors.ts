// wiki-module/src/shared/errors.ts
// エラーコード規約（Coding Standard 第8章）: {DOMAIN}_{REASON}
export class AppError extends Error {
  constructor(public code: string, message: string, public httpStatus = 400) { super(message); }
}
export const Errors = {
  validation:        (msg: string) => new AppError('VALIDATION_ERROR', msg, 400),
  selfVoteForbidden: () => new AppError('SELF_VOTE_FORBIDDEN', '自己の投稿には投票できません', 403),
  postNotFound:      () => new AppError('POST_NOT_FOUND', '投稿が見つかりません', 404),
  invalidTransition: (from: string, action: string) =>
                        new AppError('POST_INVALID_TRANSITION', `状態 ${from} では ${action} できません`, 409),
  forbidden:         (msg = '権限がありません') => new AppError('AUTH_FORBIDDEN', msg, 403),
  unauthorized:      () => new AppError('AUTH_REQUIRED', '認証が必要です', 401),
};
