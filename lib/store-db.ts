// Database sync utilities for Zustand store
import type { Trade, ChatMessage } from "@/lib/types"

const API_BASE = "/api"

export async function fetchTrades(): Promise<Trade[]> {
  const response = await fetch(`${API_BASE}/trades`)
  if (!response.ok) throw new Error("Failed to fetch trades")
  return response.json()
}

export async function createTrade(trade: Trade): Promise<Trade> {
  const response = await fetch(`${API_BASE}/trades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  })
  if (!response.ok) throw new Error("Failed to create trade")
  const data = await response.json()
  return data.trade
}

export async function updateTrade(id: string, trade: Trade): Promise<void> {
  const response = await fetch(`${API_BASE}/trades`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trade),
  })
  if (!response.ok) throw new Error("Failed to update trade")
}

export async function deleteTrade(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/trades?id=${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete trade")
}

export async function fetchChatMessages(): Promise<ChatMessage[]> {
  const response = await fetch(`${API_BASE}/chat-messages`)
  if (!response.ok) throw new Error("Failed to fetch chat messages")
  return response.json()
}

export async function createChatMessage(message: ChatMessage): Promise<ChatMessage> {
  const response = await fetch(`${API_BASE}/chat-messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  })
  if (!response.ok) throw new Error("Failed to create chat message")
  const data = await response.json()
  return data.message
}

export async function uploadScreenshot(
  tradeId: string,
  file: File,
  url: string,
  type: string = "chart",
  aiExtractedData?: any
): Promise<void> {
  const formData = new FormData()
  formData.append("tradeId", tradeId)
  formData.append("file", file)
  formData.append("url", url)
  formData.append("filename", file.name)
  formData.append("type", type)
  if (aiExtractedData) {
    formData.append("aiExtractedData", JSON.stringify(aiExtractedData))
  }
  
  const response = await fetch(`${API_BASE}/screenshots`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) throw new Error("Failed to upload screenshot")
}

