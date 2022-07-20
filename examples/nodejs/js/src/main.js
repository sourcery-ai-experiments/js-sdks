const DVC = require('@devcycle/nodejs-server-sdk')
const express = require('express')
const bodyParser = require('body-parser')
const { EventNames } = require('sdk/nodejs/src/eventEmitter')

const app = express()
const port = 5001
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Access-Control-Allow-Origin, Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

let dvcClient

async function startDVC() {
    dvcClient = DVC.initialize('server-939ecf39-866f-4682-8bfe-3639773b0fce', { logLevel: 'info', enableCloudBucketing: false })

    const user = {
        user_id: 'node_sdk_test',
        country: 'CA'
    }

    const partyTime = await dvcClient.variable(user, 'elliot-test', false)
    if (partyTime.value) {
        const invitation = dvcClient.variable(
            user,
            'invitation-message',
            'My birthday has been cancelled this year'
        )
        console.log('Hi there, we\'ve been friends for a long time so I thought I would tell you personally: \n')
        console.log(invitation.value)
        const event = {
            'type': 'customType',
            'target': invitation.key,
            'date': Date.now()
        }
        try {
            dvcClient.track(user, event)
        } catch (e) {
            console.error(e)
        }
    }

    const defaultVariable = dvcClient.variable(user, 'noWay-thisisA-realKEY', true)
    console.log(`Value of the variable is ${defaultVariable.value} \n`)
    const variables = await dvcClient.allVariables(user)
    console.log('Variables: ')
    console.dir(variables)
    const features = await dvcClient.allFeatures(user)
    console.log('Features: ')
    console.dir(features)

    dvcClient.subscribe(EventNames.CONFIG_UPDATED, () => {
        console.log('config updated')
    })    
}

startDVC()

function createUserFromQueryParams(queryParams) {
    let user = {}
    if (!queryParams) {
        throw new Error('Invalid query parameters')
    }
    for (const key in queryParams) {
        user[key] = queryParams[key]
    }
    if (!user.user_id) {
        throw new Error('user_id must be defined')
    }
    return user
}

app.get('/variables', (req, res) => {
    let user = createUserFromQueryParams(req.query)

    res.set(defaultHeaders)
    res.send(JSON.stringify(dvcClient.allVariables(user)))
})

app.get('/features', (req, res) => {
    let user = createUserFromQueryParams(req.query)

    res.set(defaultHeaders)
    res.send(JSON.stringify(dvcClient.allFeatures(user)))
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})