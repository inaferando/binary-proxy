
const express = require('express');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const app = express();
const port = process.env.PORT || 3000;


app.use(express.text());

app.post('*', async (req, res) => {
    const destinationHost = req.headers['x-destination-host'];
    const timeoutMs = parseInt(req.headers['x-timeout-ms']) || 60000;

    if (!destinationHost) {
        return res.send('NOT OK');
    }

    const binary = Buffer.from(req.body, 'base64');
    const destinationUrl = `https://${destinationHost}${req.url}`;

    // 30 seconds to upload single file to redmine
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    let redmineResponse = '';
    try {
        const headers = {
            'Content-type': 'application/octet-stream'
        };

        for (const headerKey of Object.keys(req.headers)) {
            // do not pass some keys
            if (headerKey == 'x-destination-host' || headerKey == 'x-timeout-ms') {
                continue;
            }

            // pass all headers if name starts from x-
            if (headerKey.indexOf('x-') == 0) {
                headers[headerKey] = req.headers[headerKey];
            }
        }

        const response = await fetch(destinationUrl, {
            method: 'POST',
            headers,
            body: binary,
            signal: controller.signal
        });

        redmineResponse = await response.json();

        console.log(`Upload request to ${destinationUrl} finished. HTTP Status ${response.status}.`);
    } catch (err) {
        // any error
        // empty string will be returned
        console.log(`Upload request to ${destinationUrl} FAILED. Error: ${err.message}`);
    } finally {
        clearTimeout(timeout);
    }

    res.json(redmineResponse);
});

app.listen(port, () => {
    console.log(`Proxy app is listening http://localhost:${port}`);
});
