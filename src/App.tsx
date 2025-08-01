import { ModsManager } from './components/mods-manager'
import { Toaster } from './components/ui/toaster'
import { ThemeProvider } from './components/theme-provider'
import './index.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="mods-manager-theme">
      <div className="min-h-screen">
        <ModsManager />
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App