import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Placeholder from './Placeholder'
import { useAuth } from '../contexts/AuthContext'
import { apiGetAuth, apiPostAuth } from '../lib/api'

export default function Inbox() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, user } = useAuth()
  const [inquiries, setInquiries] = useState([])
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState({ loading: true, error: '' })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    apiGetAuth('/api/v1/inquiries')
      .then((data) => {
        setInquiries(data)
        setStatus({ loading: false, error: '' })
      })
      .catch((error) => setStatus({ loading: false, error: error.message }))
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!inquiries.length) return

    const inquiryId = Number(searchParams.get('inquiry'))
    if (!inquiryId) return

    const matched = inquiries.find((item) => item.id === inquiryId)
    if (!matched) return

    loadMessages(matched)
    setSearchParams({}, { replace: true })
  }, [inquiries, searchParams, setSearchParams])

  const loadMessages = async (inquiry) => {
    setSelected(inquiry)
    const data = await apiGetAuth(`/api/v1/inquiries/${inquiry.id}/messages`)
    setMessages(data)
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    if (!selected || !text) return
    await apiPostAuth(`/api/v1/inquiries/${selected.id}/messages`, {
      message_text: text,
    })
    setText('')
    await loadMessages(selected)
  }

  return (
    <div className="rc-page rc-inbox">
      <div className="rc-page__header">
        <div>
          <h2>Inbox</h2>
          <p>Keep conversations organized by listing.</p>
        </div>
      </div>
      {status.loading ? <p>Loading inquiries...</p> : null}
      {status.error ? <p className="rc-error">{status.error}</p> : null}
      <div className="rc-inbox__layout">
        <Card className="rc-inbox__list">
          <h3>Threads</h3>
          {!status.loading && !status.error && inquiries.length === 0 ? (
            <Placeholder
              title="No conversations yet"
              message="Send an inquiry from a listing to start a thread."
            />
          ) : null}
          {inquiries.map((inquiry) => (
            <button
              key={inquiry.id}
              type="button"
              className={`rc-inbox__thread${selected?.id === inquiry.id ? ' active' : ''}`}
              onClick={() => loadMessages(inquiry)}
            >
              <span className="rc-inbox__thread-title">
                {inquiry.listing_title || `Listing #${inquiry.listing_id}`}
              </span>
              <span className="rc-muted">{inquiry.status}</span>
            </button>
          ))}
        </Card>
        <Card className="rc-inbox__messages">
          <div className="rc-inbox__messages-header">
            <h3>Messages</h3>
            {selected ? (
              <p className="rc-inbox__selected-thread">
                {selected.listing_title || `Listing #${selected.listing_id}`}
              </p>
            ) : null}
          </div>
          {selected ? (
            <div className="rc-message-list">
              {messages.length === 0 ? (
                <p className="rc-muted">No messages yet. Send the first one.</p>
              ) : null}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rc-message${msg.sender_id === user?.id ? ' rc-message--outgoing' : ' rc-message--incoming'}`}
                >
                  <p className="rc-message__sender">
                    {msg.sender_id === user?.id ? 'You' : (msg.sender_name || 'Other')}
                  </p>
                  <p>{msg.message_text}</p>
                  <span className="rc-muted rc-message__time">
                    {new Date(msg.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rc-muted">Select a thread to view messages.</p>
          )}
          {selected ? (
            <form className="rc-message-form" onSubmit={sendMessage}>
              <Input
                label="Message"
                name="message"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Type your message"
              />
              <Button size="sm" type="submit">
                Send
              </Button>
            </form>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
