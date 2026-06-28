import { Component } from 'react'

import Error500 from '../../pages/Error500'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <Error500 />
    }

    return this.props.children
  }
}
