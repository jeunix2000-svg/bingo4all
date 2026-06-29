// platform-core/src/promptLibrary.ts
// Prompt Library 能力。プロンプトをバージョン管理し、Agentが参照する。
export interface PromptTemplate {
  key: string;          // 例: 'wiki.summary', 'wiki.review', 'codegen.controller'
  version: string;      // 例: 'v1'
  template: string;     // {{var}} プレースホルダ
  description: string;
}
export interface PromptLibrary {
  get(key: string, version?: string): Promise<PromptTemplate>;
  render(key: string, vars: Record<string, string>, version?: string): Promise<string>;
}
