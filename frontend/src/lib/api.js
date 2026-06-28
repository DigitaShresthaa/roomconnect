const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
}

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getAuthHeader() {
  const token = localStorage.getItem('roomconnect_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : DEFAULT_HEADERS),
        ...(options.auth ? getAuthHeader() : {}),
        ...(options.headers || {}),
      },
    })
  } catch (err) {
    const networkErr = new Error(
      `Unable to reach the server. Please check that the backend is running at ${BASE_URL} and try again.`
    )
    networkErr.payload = null
    throw networkErr
  }

  if (response.status === 204) {
    return null
  }

  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    let message
    if (typeof payload === 'string') {
      message = payload || `Request failed (${response.status})`
    } else {
      message = payload?.detail || payload?.error?.message || payload?.message || `Request failed (${response.status})`
    }
    const err = new Error(message)
    err.status = response.status
    try {
      err.payload = payload
    } catch (e) {
      err.payload = null
    }
    throw err
  }

  return payload
}

export function apiGet(path, options) {
  return request(path, { ...options, method: 'GET' })
}

export function apiGetAuth(path, options) {
  return request(path, { ...options, method: 'GET', auth: true })
}

export function apiPost(path, body, options) {
  return request(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : null,
  })
}

export function apiPostAuth(path, body, options) {
  return request(path, {
    ...options,
    method: 'POST',
    auth: true,
    body: body ? JSON.stringify(body) : null,
  })
}

export function apiPostFormAuth(path, body, options) {
  return request(path, {
    ...options,
    method: 'POST',
    auth: true,
    body,
  })
}

export function apiPut(path, body, options) {
  return request(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : null,
  })
}

export function apiPutAuth(path, body, options) {
  return request(path, {
    ...options,
    method: 'PUT',
    auth: true,
    body: body ? JSON.stringify(body) : null,
  })
}

export function apiPatchAuth(path, body, options) {
  return request(path, {
    ...options,
    method: 'PATCH',
    auth: true,
    body: body ? JSON.stringify(body) : null,
  })
}

export function apiDelete(path, options) {
  return request(path, { ...options, method: 'DELETE' })
}

export function apiDeleteAuth(path, options) {
  return request(path, { ...options, method: 'DELETE', auth: true })
}
