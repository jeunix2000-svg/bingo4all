// platform-core/src/mcpGateway.ts
// MCP Gateway 能力。外部ツール/データ接続を標準化（ADR-006）。
export interface McpTool { name: string; description: string; }
export interface McpGateway {
  listTools(): Promise<McpTool[]>;
  call(tool: string, args: Record<string, unknown>): Promise<unknown>;
}
