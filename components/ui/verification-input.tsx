import React, { useRef, useState } from 'react'

interface VerificationInputProps {
  length?: number
  onChange: (value: string) => void
  loading?: boolean
}

export function VerificationInput({ 
  length = 6, 
  onChange,
  loading = false 
}: VerificationInputProps) {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''))
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const processInput = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    const num = e.target.value
    if (/[^0-9]/.test(num)) return
    const newCode = [...code]
    newCode[slot] = num
    setCode(newCode)
    
    const combinedCode = newCode.join('')
    if (combinedCode.length === length) {
      onChange(combinedCode)
    }

    if (slot !== length - 1 && num) {
      inputs.current[slot + 1]?.focus()
    }
  }

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>, slot: number) => {
    if (e.key === 'Backspace' && !code[slot] && slot !== 0) {
      const newCode = [...code]
      newCode[slot - 1] = ''
      setCode(newCode)
      inputs.current[slot - 1]?.focus()
    }
  }

  return (
    <div className="flex gap-4 items-center justify-center">
      {code.map((num, idx) => (
        <div key={idx} className="w-12">
          <input
            ref={el => { inputs.current[idx] = el }}
            value={num}
            onChange={(e) => processInput(e, idx)}
            onKeyUp={(e) => onKeyUp(e, idx)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={loading}
            className={`
              w-full h-12 text-center text-2xl font-bold rounded-md border
              focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${loading ? 'bg-gray-100' : 'bg-white'}
            `}
          />
        </div>
      ))}
    </div>
  )
} 