// import logo from '/logo.png'
import { ConnectedWallets } from '../wallet/ConnectedWallets'
import { ConnectionToggle } from '../ConnectionToggle'

export function Navbar() {
  return (
    <nav className="bg-primary shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4 relative">
            {/* <img 
              src={logo} 
              alt="PureBite logo" 
              className="h-24 w-24 relative z-10 -my-4"
            /> */}
            <h1 className="text-2xl font-bold text-white font-unbounded">
              PureBite
            </h1>
          </div>

          <div className="flex items-center space-x-4 min-w-0 flex-1 justify-end">
            <ConnectionToggle />
            <ConnectedWallets />
          </div>
        </div>
      </div>
    </nav>
  )
}
