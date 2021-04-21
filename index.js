
const express = require('express');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const app = express();
const port = process.env.PORT || 3000;


app.use(express.text());

app.post('/', async (req, res) => {
    const redmineApiKey = req.headers['x-redmine-api-key'];
    const redmineHost = req.headers['x-redmine-host'];
    const redmineFileName = req.headers['x-redmine-file-name'];

    if (!(redmineApiKey && redmineHost && redmineFileName)) {
        return res.send('NOT OK');
    }

    const binary = Buffer.from(req.body, 'base64');
    const redmineUploadEndpoint = `https://${redmineHost}/uploads.json?filename=${redmineFileName}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 30000);

    let redmineResponse = '';
    try {
        const response = await fetch(redmineUploadEndpoint, {
            method: 'POST',
            headers: {
                'X-Redmine-API-Key': redmineApiKey,
                'Content-type': 'application/octet-stream'
            },
            body: binary,
            signal: controller.signal
        });

        redmineResponse = await response.text();

        console.log(`Upload request to ${redmineUploadEndpoint} finished. HTTP Status ${response.status}.`);
    } catch (err) {
        // any error
        // empty string will be returned
        console.log(`Upload request to ${redmineUploadEndpoint} FAILED. Error: ${err.message}`);
    } finally {
        clearTimeout(timeout);
    }

    res.send(redmineResponse);
});

app.listen(port, () => {
    console.log(`Proxy app is listening http://localhost:${port}`);
});
