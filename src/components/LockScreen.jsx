/**
 * LockScreen — Fullscreen paper PIN pad overlay with recovery & master reset
 *
 * Features:
 * - 4-digit PIN keypad with dot indicators & shake animation on error
 * - "Forgot PIN?" flow via Security Question verification
 * - "Forgot Answer?" Master Reset confirmation modal
 */

import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import {
  verifyPin,
  getSecurityQuestion,
  verifySecurityAnswer,
  removeLockConfig,
} from '../utils/security'

export default function LockScreen({ onUnlock, diaryName }) {
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState('pin') // 'pin' | 'recovery'
  const [errorMsg, setErrorMsg] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  // Recovery state
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswerInput, setSecurityAnswerInput] = useState('')
  const [showMasterResetModal, setShowMasterResetModal] = useState(false)

  useEffect(() => {
    getSecurityQuestion().then(setSecurityQuestion)
  }, [])

  const handleDigit = async (digit) => {
    setErrorMsg('')
    if (pin.length < 4) {
      const nextPin = pin + digit
      setPin(nextPin)

      if (nextPin.length === 4) {
        const isValid = await verifyPin(nextPin)
        if (isValid) {
          onUnlock()
        } else {
          setIsShaking(true)
          setErrorMsg('Incorrect PIN')
          setTimeout(() => {
            setIsShaking(false)
            setPin('')
          }, 600)
        }
      }
    }
  }

  const handleDeleteDigit = () => {
    setErrorMsg('')
    setPin((prev) => prev.slice(0, -1))
  }

  const handleVerifyAnswer = async (e) => {
    e.preventDefault()
    if (!securityAnswerInput.trim()) return

    const isValid = await verifySecurityAnswer(securityAnswerInput)
    if (isValid) {
      await removeLockConfig()
      onUnlock()
    } else {
      setErrorMsg('Incorrect answer. Try again.')
    }
  }

  const handleMasterReset = async () => {
    await removeLockConfig()
    setShowMasterResetModal(false)
    onUnlock()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-paper paper-texture p-6 animate-fade-in">
      {/* Top Branding */}
      <div className="flex flex-col items-center pt-8">
        <img src={logo} alt="Logo" className="w-14 h-14 drop-shadow-md mb-2" />
        <h1 className="font-serif text-2xl font-semibold text-ink tracking-wide">
          {diaryName || 'Dear Diary'}
        </h1>
        <p className="font-serif text-xs text-ink-light italic mt-0.5">
          {mode === 'pin' ? 'Passcode Locked' : 'Security Recovery'}
        </p>
      </div>

      {/* Main Mode Content */}
      {mode === 'pin' ? (
        <div className="w-full max-w-xs flex flex-col items-center">
          {/* PIN Dots */}
          <div
            className={`flex items-center gap-5 mb-6 ${
              isShaking ? 'animate-bounce text-accent' : ''
            }`}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  i < pin.length
                    ? 'bg-accent border-accent scale-110'
                    : 'border-paper-line bg-paper-dark/30'
                }`}
              />
            ))}
          </div>

          {errorMsg ? (
            <p className="font-serif text-xs text-accent font-medium mb-4 h-5 text-center">
              {errorMsg}
            </p>
          ) : (
            <div className="h-5 mb-4" />
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleDigit(String(num))}
                className="h-14 rounded-2xl bg-paper-dark/40 hover:bg-paper-dark/70 text-ink font-serif text-xl font-semibold border border-paper-line/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleDigit('0')}
              className="h-14 rounded-2xl bg-paper-dark/40 hover:bg-paper-dark/70 text-ink font-serif text-xl font-semibold border border-paper-line/50 cursor-pointer active:scale-95 transition-all flex items-center justify-center shadow-sm"
            >
              0
            </button>
            <button
              onClick={handleDeleteDigit}
              className="h-14 rounded-2xl bg-paper-dark/20 hover:bg-paper-dark/50 text-ink-light hover:text-ink font-serif text-base border border-paper-line/30 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
            >
              ⌫
            </button>
          </div>

          <button
            onClick={() => {
              setErrorMsg('')
              setMode('recovery')
            }}
            className="font-serif text-xs text-accent hover:underline cursor-pointer border-none bg-transparent"
          >
            Forgot PIN?
          </button>
        </div>
      ) : (
        /* Security Question Recovery Mode */
        <form
          onSubmit={handleVerifyAnswer}
          className="w-full max-w-xs flex flex-col items-center p-6 rounded-2xl bg-paper-dark/30 border border-paper-line/50 shadow-md"
        >
          <h2 className="font-serif text-sm font-bold text-ink text-center mb-1">
            Security Question
          </h2>
          <p className="font-serif text-xs text-ink-light text-center mb-2 italic">
            "{securityQuestion}"
          </p>
          <p className="font-serif text-[11px] text-ink-faint text-center mb-4 leading-tight">
            Verifying your answer will reset and disable the passcode lock.
          </p>

          <input
            type="text"
            value={securityAnswerInput}
            onChange={(e) => setSecurityAnswerInput(e.target.value)}
            placeholder="Type your answer..."
            className="w-full p-3 rounded-xl bg-paper border border-paper-line font-serif text-sm text-ink mb-3 outline-none text-center"
            autoFocus
          />

          {errorMsg && (
            <p className="font-serif text-xs text-accent font-medium mb-3 text-center">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-serif text-xs font-bold text-white uppercase tracking-wider border-none cursor-pointer shadow-md transition-all active:scale-95 mb-3"
            style={{
              background:
                'linear-gradient(135deg, #C9A96E 0%, #A07D3A 50%, #8B6914 100%)',
            }}
          >
            Reset Lock & Unlock
          </button>

          <div className="flex justify-between w-full mt-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg('')
                setMode('pin')
              }}
              className="font-serif text-xs text-ink-light hover:text-ink cursor-pointer border-none bg-transparent"
            >
              Back to PIN
            </button>
            <button
              type="button"
              onClick={() => setShowMasterResetModal(true)}
              className="font-serif text-xs text-accent hover:underline cursor-pointer border-none bg-transparent"
            >
              Forgot Answer?
            </button>
          </div>
        </form>
      )}

      {/* Footer Branding */}
      <div className="pb-4 text-center">
        <p className="font-serif text-[10px] text-ink-faint">
          Protected with Screen Lock
        </p>
      </div>

      {/* Master Reset Modal */}
      {showMasterResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl bg-paper p-6 shadow-2xl border border-paper-line text-center">
            <div className="w-12 h-12 rounded-full bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
              ⚠️
            </div>
            <h3 className="font-serif text-base font-bold text-ink mb-1">
              Master Reset Passcode?
            </h3>
            <p className="font-serif text-xs text-ink-light leading-relaxed mb-5">
              This will remove the passcode lock so you can regain access to your diary. Your diary entries will remain safe.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMasterResetModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-paper-line font-serif text-xs text-ink font-semibold cursor-pointer bg-paper-dark/30 hover:bg-paper-dark/60 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleMasterReset}
                className="flex-1 py-2.5 rounded-xl border-none font-serif text-xs text-white font-bold cursor-pointer bg-accent hover:bg-accent-dark transition-all"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
