export type ContributionKind = 'ANSWER' | 'SUPPLEMENT';
export interface ContributionCreateDto { kind: ContributionKind; body: string; }
export interface ContributionDto {
  id: string; postId: string; authorId: string; kind: ContributionKind;
  isAccepted: boolean; createdAt: string;
}
