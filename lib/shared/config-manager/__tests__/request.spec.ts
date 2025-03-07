jest.mock('cross-fetch')
import fetch, { Response } from 'cross-fetch'

global.fetch = fetch

import { getEnvironmentConfig } from '../src/request'
const fetchRequestMock = fetch as jest.MockedFn<typeof fetch>

describe('request.ts Unit Tests', () => {
    beforeEach(() => {
        fetchRequestMock.mockReset()
    })

    describe('getEnvironmentConfig', () => {
        it('should get environment config', async () => {
            const url = 'https://test.devcycle.com/config'
            const etag = 'etag_value'
            const lastModified = 'last_modified_value'
            fetchRequestMock.mockResolvedValue(
                new Response('', { status: 200 }) as any,
            )

            const res = await getEnvironmentConfig(
                url,
                60000,
                etag,
                lastModified,
            )
            expect(res.status).toEqual(200)
            expect(fetchRequestMock).toBeCalledWith(url, {
                headers: {
                    'If-None-Match': etag,
                    'If-Modified-Since': lastModified,
                    'Content-Type': 'application/json',
                },
                retries: 1,
                retryDelay: expect.any(Function),
                retryOn: expect.any(Function),
                method: 'GET',
                signal: expect.any(AbortSignal),
            })
        })
    })
})
