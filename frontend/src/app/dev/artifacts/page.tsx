"use client"

/**
 * Development page for testing artifact preview system
 *
 * This page demonstrates all features:
 * - Multiple artifact types (HTML, React, TypeScript, CSS)
 * - Tab switching
 * - View mode toggling (Preview/Code/Split)
 * - Device preview (Desktop/Tablet/Mobile)
 * - Code editing with syntax highlighting
 * - Download, Copy, Share actions
 */

import { useState } from "react"
import { ArtifactPreviewPanel } from "@/shared/components/artifacts"
import type { Artifact } from "@/features/generation/types"

// Mock artifacts for testing
const MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "artifact-1",
    conversation_id: "conv-1",
    message_id: "msg-1",
    type: "html",
    title: "Interactive Landing Page",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beautiful Landing Page</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    h1 {
      font-size: 3rem;
      color: #333;
      margin-bottom: 20px;
      animation: fadeInDown 0.8s ease-out;
    }

    p {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 40px;
      line-height: 1.6;
      animation: fadeInUp 0.8s ease-out 0.2s both;
    }

    .cta-button {
      display: inline-block;
      padding: 15px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1rem;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      animation: fadeInUp 0.8s ease-out 0.4s both;
    }

    .cta-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
      margin-top: 60px;
    }

    .feature {
      padding: 30px;
      background: #f8f9fa;
      border-radius: 15px;
      transition: transform 0.3s ease;
      animation: fadeIn 0.8s ease-out;
    }

    .feature:hover {
      transform: translateY(-5px);
    }

    .feature h3 {
      color: #667eea;
      margin-bottom: 10px;
      font-size: 1.3rem;
    }

    .feature p {
      color: #666;
      font-size: 0.95rem;
      margin: 0;
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Welcome to Viably</h1>
    <p>
      Build and deploy web applications in seconds with the power of AI.
      No coding required, just describe what you want.
    </p>
    <a href="#" class="cta-button" onclick="handleClick(event)">Get Started</a>

    <div class="features">
      <div class="feature">
        <h3>⚡ Lightning Fast</h3>
        <p>Generate production-ready code in seconds</p>
      </div>
      <div class="feature">
        <h3>🎨 Beautiful Design</h3>
        <p>Get pixel-perfect, responsive designs</p>
      </div>
      <div class="feature">
        <h3>🔒 Secure</h3>
        <p>Enterprise-grade security built-in</p>
      </div>
    </div>
  </div>

  <script>
    function handleClick(event) {
      event.preventDefault();
      const button = event.target;
      button.textContent = '✅ Clicked!';
      button.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';

      setTimeout(() => {
        button.textContent = 'Get Started';
        button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 2000);
    }

    // Add some interactivity
    document.querySelectorAll('.feature').forEach((feature, index) => {
      feature.style.animationDelay = \`\${0.6 + index * 0.1}s\`;
    });
  </script>
</body>
</html>`,
    language: "html",
    version: 1,
    parent_artifact_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "artifact-2",
    conversation_id: "conv-1",
    message_id: "msg-2",
    type: "typescript",
    title: "User Authentication Hook",
    content: `import { useState, useEffect, useCallback } from 'react'
import type { User } from "@/shared/types"

interface UseAuthResult {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

/**
 * Custom hook for managing user authentication
 *
 * Features:
 * - Automatic session restoration
 * - Token refresh
 * - Protected route handling
 * - Optimistic updates
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from session on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }
}`,
    language: "typescript",
    version: 1,
    parent_artifact_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "artifact-3",
    conversation_id: "conv-1",
    message_id: "msg-3",
    type: "css",
    title: "Modern Button Styles",
    content: `/* Modern Button Component Styles */

.button {
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  /* Typography */
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;

  /* Spacing */
  padding: 0.625rem 1rem;

  /* Appearance */
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;

  /* Transitions */
  transition: all 0.2s ease-in-out;

  /* Focus styles */
  outline: none;

  /* Disabled state */
  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
}

/* Primary variant */
.button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

/* Secondary variant */
.button-secondary {
  background: #f8f9fa;
  color: #495057;
  border-color: #dee2e6;

  &:hover:not(:disabled) {
    background: #e9ecef;
    border-color: #adb5bd;
  }
}

/* Outline variant */
.button-outline {
  border-color: #667eea;
  color: #667eea;

  &:hover:not(:disabled) {
    background: #667eea;
    color: white;
  }
}

/* Ghost variant */
.button-ghost {
  &:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.1);
  }
}

/* Link variant */
.button-link {
  color: #667eea;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }
}

/* Size variants */
.button-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.button-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.button-xl {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Icon button */
.button-icon {
  padding: 0.625rem;
  aspect-ratio: 1;
}

/* Loading state */
.button-loading {
  position: relative;
  color: transparent;

  &::after {
    content: '';
    position: absolute;
    width: 1rem;
    height: 1rem;
    top: 50%;
    left: 50%;
    margin-left: -0.5rem;
    margin-top: -0.5rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: button-spin 0.6s linear infinite;
  }
}

@keyframes button-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}`,
    language: "css",
    version: 1,
    parent_artifact_id: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "artifact-4",
    conversation_id: "conv-1",
    message_id: "msg-4",
    type: "python",
    title: "API Rate Limiter",
    content: `"""
Simple rate limiter for API endpoints using token bucket algorithm
"""

import time
from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class TokenBucket:
    """Token bucket for rate limiting"""

    capacity: int  # Maximum tokens
    refill_rate: float  # Tokens per second
    tokens: float  # Current tokens
    last_refill: float  # Last refill timestamp

    def refill(self) -> None:
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - self.last_refill

        # Add tokens based on elapsed time
        new_tokens = elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + new_tokens)
        self.last_refill = now

    def consume(self, tokens: int = 1) -> bool:
        """
        Try to consume tokens

        Returns:
            True if tokens were consumed, False otherwise
        """
        self.refill()

        if self.tokens >= tokens:
            self.tokens -= tokens
            return True

        return False


class RateLimiter:
    """
    Rate limiter using token bucket algorithm

    Example:
        limiter = RateLimiter(max_requests=100, window_seconds=60)

        if limiter.allow("user_123"):
            # Process request
            pass
        else:
            # Reject request
            pass
    """

    def __init__(
        self,
        max_requests: int,
        window_seconds: float,
    ):
        """
        Initialize rate limiter

        Args:
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.refill_rate = max_requests / window_seconds

        # Store buckets per identifier (user_id, ip, etc.)
        self.buckets: Dict[str, TokenBucket] = {}

    def allow(self, identifier: str, tokens: int = 1) -> bool:
        """
        Check if request is allowed for identifier

        Args:
            identifier: Unique identifier (user_id, ip, etc.)
            tokens: Number of tokens to consume (default: 1)

        Returns:
            True if request is allowed, False otherwise
        """
        # Get or create bucket for identifier
        if identifier not in self.buckets:
            self.buckets[identifier] = TokenBucket(
                capacity=self.max_requests,
                refill_rate=self.refill_rate,
                tokens=self.max_requests,
                last_refill=time.time(),
            )

        bucket = self.buckets[identifier]
        return bucket.consume(tokens)

    def remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        if identifier not in self.buckets:
            return self.max_requests

        bucket = self.buckets[identifier]
        bucket.refill()
        return int(bucket.tokens)

    def reset_time(self, identifier: str) -> Optional[float]:
        """Get time until full reset for identifier"""
        if identifier not in self.buckets:
            return None

        bucket = self.buckets[identifier]
        bucket.refill()

        if bucket.tokens >= self.max_requests:
            return 0.0

        tokens_needed = self.max_requests - bucket.tokens
        return tokens_needed / self.refill_rate


# Example usage
if __name__ == "__main__":
    # Create limiter: 10 requests per minute
    limiter = RateLimiter(max_requests=10, window_seconds=60)

    # Test requests
    user_id = "user_123"

    for i in range(15):
        if limiter.allow(user_id):
            print(f"Request {i+1}: Allowed (remaining: {limiter.remaining(user_id)})")
        else:
            print(f"Request {i+1}: Blocked (reset in: {limiter.reset_time(user_id):.1f}s)")

        time.sleep(0.1)
`,
    language: "python",
    version: 1,
    parent_artifact_id: null,
    created_at: new Date().toISOString(),
  },
]

// ============================================================================
// React mock artifacts — used for testing Sandpack / WebContainer preview
// ============================================================================

const REACT_MOCK_ARTIFACTS: Artifact[] = [
  {
    id: "react-artifact-1",
    conversation_id: "conv-react",
    message_id: "msg-react-1",
    type: "react",
    title: "src/App.tsx",
    content: `import { useState } from 'react'
import { Button } from './components/ui/button'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-foreground">
          Sandpack Preview Test
        </h1>
        <p className="text-muted-foreground text-lg">
          If you can see this, Sandpack is working correctly!
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" onClick={() => setCount(c => c - 1)}>
            -
          </Button>
          <span className="text-2xl font-mono font-bold text-foreground w-16 text-center">
            {count}
          </span>
          <Button onClick={() => setCount(c => c + 1)}>
            +
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Counter value: {count}
        </p>
      </div>
    </div>
  )
}
`,
    language: "typescript",
    version: 1,
    parent_artifact_id: null,
    created_at: new Date().toISOString(),
  },
]

export default function ArtifactsDevPage() {
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(
    MOCK_ARTIFACTS[0].id
  )
  const [reactActiveArtifactId, setReactActiveArtifactId] = useState<string | null>(
    REACT_MOCK_ARTIFACTS[0].id
  )

  const handleUpdateArtifact = async (
    artifactId: string,
    update: { content: string; title?: string }
  ) => {
    console.log("Update artifact:", artifactId, update)
    // In real implementation, this would call the API
    // For now, just log the update
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '200vh' }}>
      {/* Header */}
      <div className="border-b border-border/50 bg-muted/20 px-6 py-4">
        <h1 className="font-heading text-2xl font-bold">
          Artifact Preview System
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Testing all artifact types, view modes, and features
        </p>
      </div>

      {/* Section 1: HTML artifacts */}
      <div className="border-b border-border/30 px-6 py-2 bg-muted/10">
        <p className="text-xs text-muted-foreground font-mono">Section 1: HTML/CSS/TypeScript artifacts (HTMLPreview path)</p>
      </div>
      <div style={{ height: '60vh', overflow: 'hidden' }}>
        <ArtifactPreviewPanel
          artifacts={MOCK_ARTIFACTS}
          activeArtifactId={activeArtifactId}
          onSelectArtifact={setActiveArtifactId}
          onUpdateArtifact={handleUpdateArtifact}
        />
      </div>

      {/* Section 2: React artifacts — Sandpack preview path */}
      <div className="border-b border-border/30 px-6 py-2 bg-amber-500/10">
        <p className="text-xs text-amber-600 font-mono font-bold">Section 2: React/TSX artifacts (WebContainerPreview → Sandpack path)</p>
      </div>
      <div style={{ height: '80vh', overflow: 'hidden' }}>
        <ArtifactPreviewPanel
          artifacts={REACT_MOCK_ARTIFACTS}
          activeArtifactId={reactActiveArtifactId}
          onSelectArtifact={setReactActiveArtifactId}
          onUpdateArtifact={handleUpdateArtifact}
        />
      </div>
    </div>
  )
}
