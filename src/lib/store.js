import { useState, useEffect } from 'react'

const PREFIX = 'w2w:'

export function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw !== null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch { /* storage full / private mode — keep in-memory state */ }
  }, [key, value])
  return [value, setValue]
}
