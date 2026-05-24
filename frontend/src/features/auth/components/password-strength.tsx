"use client"

interface PasswordStrengthProps {
  password: string
}

/**
 * PasswordStrength Component
 *
 * Displays a visual strength meter and validation rules for password input.
 * Strength is calculated based on: length, uppercase, numbers, and special characters.
 */
export function PasswordStrength({ password }: PasswordStrengthProps) {
  // Don't render anything if password is empty
  if (!password) {
    return null
  }

  // Calculate strength score (0-4)
  const calculateStrength = (pwd: string): number => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const score = calculateStrength(password)

  // Map score to level and color
  const getLevel = (
    score: number
  ): { name: string; color: string; textColor: string } => {
    switch (score) {
      case 0:
        return { name: "", color: "bg-muted", textColor: "text-muted-foreground" }
      case 1:
        return { name: "Слабый", color: "bg-red-500", textColor: "text-red-500" }
      case 2:
        return { name: "Средний", color: "bg-orange-500", textColor: "text-orange-500" }
      case 3:
        return { name: "Хороший", color: "bg-yellow-500", textColor: "text-yellow-500" }
      case 4:
        return { name: "Надёжный", color: "bg-green-500", textColor: "text-green-500" }
      default:
        return { name: "", color: "bg-muted", textColor: "text-muted-foreground" }
    }
  }

  const level = getLevel(score)

  return (
    <div className="space-y-2">
      {/* Strength bar with 4 segments */}
      <div
        className="flex gap-1"
        role="meter"
        aria-label={`Надёжность пароля: ${level.name || "Нет"}`}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
      >
        {[1, 2, 3, 4].map((segment) => (
          <div
            key={segment}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              segment <= score ? level.color : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Level label */}
      {level.name && (
        <p className={`text-sm font-medium ${level.textColor}`}>{level.name}</p>
      )}

      {/* Requirements text */}
      <p className="text-xs text-muted-foreground">
        8+ символов, заглавная буква, цифра, спецсимвол
      </p>
    </div>
  )
}
