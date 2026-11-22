import { useApp } from './stores/appStore'
import Landing from './components/landing/Landing'
import Dashboard from './components/dashboard/Dashboard'
import Editor from './components/editor/Editor'

export default function App() {
  const view = useApp((s) => s.view)
  if (view === 'editor') return <Editor />
  if (view === 'dashboard') return <Dashboard />
  return <Landing />
}
