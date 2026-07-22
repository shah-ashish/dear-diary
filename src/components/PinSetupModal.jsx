/**
 * PinSetupModal — 3-step setup modal for setting/changing PIN & Security Question
 *
 * Step 1: Enter 4-digit PIN
 * Step 2: Confirm 4-digit PIN
 * Step 3: Select Security Question & Answer
 */

import { useState } from 'react'

const PRESET_QUESTIONS = [
  'What was the name of your first pet?',
  "What is your mother's maiden name?",
  'What city were you born in?',
  'What was your childhood nickname?',
  'Custom Question...',
]

export default function PinSetupModal({ onSave, onCancel }) {
  const [step, setStep] = useState(1) // 1: Enter, 2: Confirm, 3: Security Question
  const [firstPin, setFirstPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  // Security Question state
  const [selectedQuestion, setSelectedQuestion] = useState(PRESET_QUESTIONS[0])
  const [customQuestion, setCustomQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const handleDigit = (digit) => {
    setErrorMsg('')
    if (step === 1) {
      if (firstPin.length < 4) {
        const next = firstPin + digit
        setFirstPin(next)
        if (next.length === 4) {
          setTimeout(() => setStep(2), 200)
        }
      }
    } else if (step === 2) {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit
        setConfirmPin(next)
        if (next.length === 4) {
          if (next === firstPin) {
            setTimeout(() => setStep(3), 200)
          } else {
            setIsShaking(true)
            setErrorMsg('PINs do not match. Try again.')
            setTimeout(() => {
              setIsShaking(false)
              setFirstPin('')
              setConfirmPin('')
              setStep(1)
            }, 800)
          }
        }
      }
    }
  }

  const handleDelete = () => {
    setErrorMsg('')
    if (step === 1) {
      setFirstPin((prev) => prev.slice(0, -1))
    } else if (step === 2) {
      setConfirmPin((prev) => prev.slice(0, -1))
    }
  }

  const handleFinish = (e) => {
    e.preventDefault()
    const questionToSave =
      selectedQuestion === 'Custom Question...' ? customQuestion.trim() : selectedQuestion
    const answerToSave = answer.trim()

    if (!questionToSave) {
      setErrorMsg('Please provide a security question.')
      return
    }
    if (!answerToSave) {
      setErrorMsg('Please provide an answer to your security question.')
      return
    }

    onSave(firstPin, questionToSave, answerToSave)
  }

  const currentPinLength = step === 1 ? firstPin.length : confirmPin.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-paper p-6 shadow-2xl border border-paper-line relative flex flex-col items-center">
        {/* Close / Cancel Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-ink-light hover:text-ink border-none bg-transparent cursor-pointer p-1"
        >
          ✕
        </button>

        {/* Step 1 & 2: PIN Keypad */}
        {(step === 1 || step === 2) && (
          <div className="w-full flex flex-col items-center">
            <h2 className="font-serif text-lg font-bold text-ink text-center">
              {step === 1 ? 'Create a 4-Digit PIN' : 'Confirm Your PIN'}
            </h2>
            <p className="font-serif text-xs text-ink-light text-center mt-1 mb-6">
              {step === 1
                ? 'Enter a PIN to lock your diary'
                : 'Re-enter your 4-digit PIN to confirm'}
            </p>

            {/* PIN Dots */}
            <div
              className={`flex items-center gap-4 mb-6 ${
                isShaking ? 'animate-bounce text-accent' : ''
              }`}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    i < currentPinLength
                      ? 'bg-accent border-accent scale-110'
                      : 'border-paper-line bg-paper-dark/30'
                  }`}
                />
              ))}
            </div>

            {errorMsg && (
              <p className="font-serif text-xs text-accent font-medium mb-4 text-center">
                {errorMsg}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleDigit(String(num))}
                  className="h-12 rounded-xl bg-paper-dark/40 hover:bg-paper-dark/70 text-ink font-serif text-lg font-semibold border border-paper-line/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigit('0')}
                className="h-12 rounded-xl bg-paper-dark/40 hover:bg-paper-dark/70 text-ink font-serif text-lg font-semibold border border-paper-line/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="h-12 rounded-xl bg-paper-dark/20 hover:bg-paper-dark/50 text-ink-light hover:text-ink font-serif text-sm border border-paper-line/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Security Question & Answer */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="w-full flex flex-col">
            <h2 className="font-serif text-lg font-bold text-ink text-center">
              Security Question
            </h2>
            <p className="font-serif text-xs text-ink-light text-center mt-1 mb-4">
              Used to reset your PIN if you forget it
            </p>

            <label className="font-serif text-xs text-ink-light font-bold mb-1">
              Select Question
            </label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-paper-dark/50 border border-paper-line font-serif text-xs text-ink mb-3 outline-none"
            >
              {PRESET_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>

            {selectedQuestion === 'Custom Question...' && (
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Type your security question..."
                className="w-full p-2.5 rounded-lg bg-paper-dark/50 border border-paper-line font-serif text-xs text-ink mb-3 outline-none"
              />
            )}

            <label className="font-serif text-xs text-ink-light font-bold mb-1">
              Your Answer
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter answer (case-insensitive)"
              className="w-full p-2.5 rounded-lg bg-paper-dark/50 border border-paper-line font-serif text-xs text-ink mb-4 outline-none"
            />

            {errorMsg && (
              <p className="font-serif text-xs text-accent font-medium mb-3 text-center">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-serif text-sm font-bold text-white uppercase tracking-wider border-none cursor-pointer shadow-md transition-all active:scale-95"
              style={{
                background:
                  'linear-gradient(135deg, #C9A96E 0%, #A07D3A 50%, #8B6914 100%)',
              }}
            >
              Enable App Lock
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
