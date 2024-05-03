import { ConfigBody, DVCLogger } from '@devcycle/types'
import { getEnvironmentConfig } from './request'
import { ResponseError, UserError } from '@devcycle/server-request'
import { SSEConnection } from '@devcycle/sse-connection'

type ConfigPollingOptions = {
    configPollingIntervalMS?: number
    configPollingTimeoutMS?: number
    configCDNURI?: string
    cdnURI?: string
    clientMode?: boolean
    disableRealtimeUpdates?: boolean
}

enum ConfigFetchState {
    POLLING,
    SSE,
    DISABLED,
}

type SetIntervalInterface = (handler: () => void, timeout?: number) => any
type ClearIntervalInterface = (intervalTimeout: any) => void

type SetConfigBuffer = (sdkKey: string, projectConfig: string) => void

export class EnvironmentConfigManager {
    private readonly logger: DVCLogger
    private readonly sdkKey: string
    private hasConfig = false

    configEtag?: string
    configLastModified?: string
    configSSE?: ConfigBody<string>['sse']

    private readonly pollingIntervalMS: number
    private readonly requestTimeoutMS: number
    private readonly cdnURI: string
    private readonly disableRealtimeUpdates: boolean

    fetchConfigPromise: Promise<void>
    private intervalTimeout?: any
    private readonly setConfigBuffer: SetConfigBuffer
    private readonly setInterval: SetIntervalInterface
    private readonly clearInterval: ClearIntervalInterface
    private clientMode: boolean
    private configFetchState: ConfigFetchState
    private sseConnection?: SSEConnection

    constructor(
        logger: DVCLogger,
        sdkKey: string,
        setConfigBuffer: SetConfigBuffer,
        setInterval: SetIntervalInterface,
        clearInterval: ClearIntervalInterface,
        {
            configPollingIntervalMS = 10000,
            configPollingTimeoutMS = 5000,
            configCDNURI,
            cdnURI = 'https://config-cdn.devcycle.com',
            clientMode = false,
            disableRealtimeUpdates = false,
        }: ConfigPollingOptions,
    ) {
        this.logger = logger
        this.sdkKey = sdkKey

        this.setConfigBuffer = setConfigBuffer
        this.setInterval = setInterval
        this.clearInterval = clearInterval
        this.clientMode = clientMode
        this.disableRealtimeUpdates = disableRealtimeUpdates
        this.configFetchState = disableRealtimeUpdates
            ? ConfigFetchState.POLLING
            : ConfigFetchState.SSE

        this.pollingIntervalMS =
            configPollingIntervalMS >= 1000 ? configPollingIntervalMS : 1000
        this.requestTimeoutMS =
            configPollingTimeoutMS >= this.pollingIntervalMS
                ? this.pollingIntervalMS
                : configPollingTimeoutMS
        this.cdnURI = configCDNURI || cdnURI

        this.fetchConfigPromise = this._fetchConfig()
            .then(() => {
                this.logger.debug('DevCycle initial config loaded')
            })
            .finally(() => {
                this.startWatchingForConfigChanges()
            })
    }

    startWatchingForConfigChanges(): void {
        if (this.configFetchState === ConfigFetchState.DISABLED) {
            this.logger.warn(
                'Config fetching is disabled to start watching for config changes',
            )
            return
        }

        if (this.disableRealtimeUpdates) {
            this.startPolling()
        } else {
            this.startSSE()
        }
    }

    stopWatchingForConfigChanges(): void {
        this.configFetchState = ConfigFetchState.DISABLED
        this.stopPolling()
        this.stopSSE()
    }

    private startSSE(): void {
        if (this.configFetchState === ConfigFetchState.POLLING) {
            this.stopPolling()
        }

        if (!this.configSSE) {
            this.logger.warn('No SSE configuration found, switching to polling')
            this.startPolling()
            return
        }

        this.configFetchState = ConfigFetchState.SSE
        const url = new URL(
            this.configSSE.path,
            this.configSSE.hostname,
        ).toString()
        this.logger.debug(`Starting SSE connection to ${url}`)

        this.sseConnection = new SSEConnection(
            url,
            this.logger,
            this.onSSEMessage.bind(this),
            () => {
                this.logger.debug('SSE connection error, switching to polling')
                this.startPolling()
                this.stopSSE()
            },
        )
    }

    private onSSEMessage(message: string): void {
        this.logger.debug(`SSE message: ${message}`)
        try {
            const parsedMessage = JSON.parse(message as string)
            const messageData = JSON.parse(parsedMessage.data)

            if (!messageData) {
                return
            }
            if (!messageData.type || messageData.type === 'refetchConfig') {
                if (!this.configEtag || messageData.etag !== this.configEtag) {
                    this._fetchConfig()
                        .then(() => {
                            this.logger.debug('Config refetched')
                        })
                        .catch((e) => {
                            this.logger.warn(`Failed to refetch config ${e}`)
                        })

                    // TODO: switch to config request consolidator? and check for etag / lastModified date
                    // this.refetchConfig(
                    //     true,
                    //     messageData.lastModified,
                    //     messageData.etag,
                    // ).catch((e) => {
                    //     this.logger.warn(`Failed to refetch config ${e}`)
                    // })
                }
            }
        } catch (e) {
            this.logger.warn(`Streaming Connection: Unparseable message ${e}`)
        }
    }

    private stopSSE(): void {
        if (this.sseConnection) {
            this.sseConnection.close()
            this.sseConnection = undefined
        }
    }

    private startPolling(): void {
        if (this.configFetchState === ConfigFetchState.SSE) {
            this.stopSSE()
        }

        if (this.intervalTimeout) return
        this.configFetchState = ConfigFetchState.POLLING

        this.intervalTimeout = this.setInterval(async () => {
            try {
                await this._fetchConfig()
            } catch (ex) {
                this.logger.error((ex as Error).message)
            }
        }, this.pollingIntervalMS)
    }

    private stopPolling(): void {
        this.clearInterval(this.intervalTimeout)
        this.intervalTimeout = null
    }

    cleanup(): void {
        this.stopWatchingForConfigChanges()
    }

    getConfigURL(): string {
        if (this.clientMode) {
            return `${this.cdnURI}/config/v1/server/bootstrap/${this.sdkKey}.json`
        }
        return `${this.cdnURI}/config/v1/server/${this.sdkKey}.json`
    }

    async _fetchConfig(): Promise<void> {
        const url = this.getConfigURL()
        let res: Response | null
        let projectConfig: string | null = null
        let responseError: ResponseError | null = null

        const logError = (error: any) => {
            const errMsg =
                `Request to get config failed for url: ${url}, ` +
                `response message: ${error.message}, response data: ${projectConfig}`
            if (this.hasConfig) {
                this.logger.warn(errMsg)
            } else {
                this.logger.error(errMsg)
            }
        }

        try {
            this.logger.debug(
                `Requesting new config for ${url}, etag: ${this.configEtag}` +
                    `, last-modified: ${this.configLastModified}`,
            )
            res = await getEnvironmentConfig(
                url,
                this.requestTimeoutMS,
                this.configEtag,
                this.configLastModified,
            )
            projectConfig = await res.text()
            this.logger.debug(
                `Downloaded config, status: ${
                    res?.status
                }, etag: ${res?.headers.get('etag')}`,
            )
        } catch (ex) {
            logError(ex)
            res = null
            if (ex instanceof ResponseError) {
                responseError = ex
            }
        }

        if (res?.status === 304) {
            this.logger.debug(
                `Config not modified, using cache, etag: ${this.configEtag}` +
                    `, last-modified: ${this.configLastModified}`,
            )
            return
        } else if (res?.status === 200 && projectConfig) {
            try {
                const etag = res?.headers.get('etag') || ''
                const lastModified = res?.headers.get('last-modified') || ''
                if (this.configFetchState === ConfigFetchState.SSE) {
                    const configBody = JSON.parse(
                        projectConfig,
                    ) as ConfigBody<string>
                    this.configSSE = configBody.sse
                } else {
                    this.configSSE = undefined
                }

                this.setConfigBuffer(
                    `${this.sdkKey}${this.clientMode ? '_client' : ''}`,
                    projectConfig,
                )
                this.hasConfig = true
                this.configEtag = etag
                this.configLastModified = lastModified
                return
            } catch (e) {
                logError(new Error('Invalid config JSON.'))
                res = null
            }
        }

        if (this.hasConfig) {
            this.logger.warn(
                `Failed to download config, using cached version. url: ${url}.`,
            )
        } else if (responseError?.status === 403) {
            this.stopWatchingForConfigChanges()
            throw new UserError(`Invalid SDK key provided: ${this.sdkKey}`)
        } else {
            throw new Error('Failed to download DevCycle config.')
        }
    }
}
