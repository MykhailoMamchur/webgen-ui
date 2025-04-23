export interface Prompt {
  id: string
  user_id: string
  prompt_name: string
  prompt_text: string
  created_at: string
  is_active: boolean
}

export interface PromptResponse {
  status: string
  prompt?: Prompt
  prompts?: Prompt[]
  error?: string
}
