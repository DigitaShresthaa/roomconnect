import { useState } from 'react'

import Button from './Button'
import Card from './Card'

const STORAGE_KEY = 'roomconnect_onboarding_dismissed'

const steps = [
  {
    title: 'Create your profile',
    detail: 'Register as a seeker or owner and complete your contact info.',
  },
  {
    title: 'Browse listings',
    detail: 'Use filters to narrow by location, price, and category.',
  },
  {
    title: 'Start a conversation',
    detail: 'Send an inquiry to the owner to confirm availability.',
  },
]

export default function OnboardingTips() {
  const [hidden, setHidden] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const dismiss = () => {
    setHidden(true)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    }
  }

  if (hidden) return null

  return (
    <Card className="rc-onboarding">
      <div className="rc-onboarding__header">
        <div>
          <h3>Getting started</h3>
          <p className="rc-muted">Three quick steps to feel at home.</p>
        </div>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Got it
        </Button>
      </div>
      <div className="rc-onboarding__steps">
        {steps.map((step, index) => (
          <div key={step.title} className="rc-onboarding__step">
            <span className="rc-onboarding__index">{index + 1}</span>
            <div>
              <p className="rc-onboarding__title">{step.title}</p>
              <p className="rc-muted">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
