// wiki-module/src/app.ts — Expressアプリ組み立て（依存注入）。テストからも利用。
import express, { type Express } from 'express';
import { corsMiddleware } from './shared/cors.middleware.js';
import { auth } from './shared/auth.middleware.js';
import type { PointsClient } from './shared/pointsClient.js';
import { postRouter, errorHandler } from './modules/posts/post.controller.js';
import type { PostRepository } from './modules/posts/post.repository.js';
import { PostService, type AiAssist } from './modules/posts/post.service.js';
import { VoteService, type VoteRepository } from './modules/votes/vote.service.js';
import { voteRouter } from './modules/votes/vote.controller.js';
import { RatingService, type RatingRepository } from './modules/ratings/rating.service.js';
import { ratingRouter } from './modules/ratings/rating.controller.js';
import { ContributionService } from './modules/contributions/contribution.service.js';
import type { ContributionRepository } from './modules/contributions/contribution.repository.js';
import { postContributionsRouter, contributionsRouter } from './modules/contributions/contribution.controller.js';

export interface Deps {
  posts: PostRepository;
  votes: VoteRepository;
  ratings: RatingRepository;
  contributions: ContributionRepository;
  points: PointsClient;
  ai?: AiAssist;
}

const mockAi: AiAssist = {
  async assist({ title }) { return { summary: `${title} の自動概要`, tags: ['auto'], duplicates: [] }; },
};

export function buildApp(d: Deps): Express {
  const postSvc = new PostService(d.posts, d.ai ?? mockAi, d.points);
  const voteSvc = new VoteService(d.posts, d.votes, d.points);
  const ratingSvc = new RatingService(d.posts, d.ratings, d.points);
  const contribSvc = new ContributionService(d.posts, d.contributions, d.points);

  const app = express();
  app.use(corsMiddleware);
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'wiki-module' }));

  app.use('/api/v1/posts', auth, postRouter(postSvc));
  app.use('/api/v1/posts', auth, voteRouter(voteSvc));
  app.use('/api/v1/posts', auth, ratingRouter(ratingSvc));
  app.use('/api/v1/posts', auth, postContributionsRouter(contribSvc));
  app.use('/api/v1/contributions', auth, contributionsRouter(contribSvc));

  app.use(errorHandler);
  return app;
}
