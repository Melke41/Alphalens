import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    // Fail silently — UI falls back without surfacing stack traces
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[40vh] items-center justify-center p-8 font-mono text-sm text-[#6b7280]">
            Something went wrong. Data will resume when the connection recovers.
          </div>
        )
      )
    }
    return this.props.children
  }
}
