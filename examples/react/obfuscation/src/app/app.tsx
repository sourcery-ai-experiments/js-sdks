import React from 'react'
import {
    useIsDevCycleInitialized,
    withDevCycleProvider,
} from '@devcycle/react-client-sdk'
import DevCycleExample from './DevCycleExample'

const SDK_KEY = ''
const user = {
    user_id: 'userId1',
    email: 'auto@taplytics.com',
    customData: {
        cps: 'Matthew',
        cpn: 777,
        cpb: true,
    },
    isAnonymous: false,
}

function App() {
    const devcycleReady = useIsDevCycleInitialized()

    if (!devcycleReady) {
        return (
            <div>
                <h1>DevCycle is not ready!</h1>
            </div>
        )
    }

    return (
        <div className="App">
            <header className="App-header">
                <DevCycleExample />
            </header>
        </div>
    )
}

export default withDevCycleProvider({
    sdkKey: SDK_KEY,
    user: user,
    options: {
        logLevel: 'debug',
        enableObfuscation: true,
        apiProxyURL: 'http://localhost:4030',
    },
})(App)
