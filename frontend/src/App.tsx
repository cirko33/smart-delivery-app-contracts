
import './App.css'
import { Layout } from './components/layout/Layout'
import { DAOProposalsDashboard } from './components/dao/DAOProposalsDashboard'
import { ConnectionProvider } from './contexts/ConnectionContext'

function App() {
  return (
    <ConnectionProvider>
      <Layout>
        <DAOProposalsDashboard />
      </Layout>
    </ConnectionProvider>
  )
}

export default App
