import { test, expect } from '@playwright/test';
const util = require('../ScraperUtil');
const config = require('../ConfigLoader');
const bank_config = config['SwyftxScraper'];
const httpRequest = require('https');

test('test', async ({ page }) => {
    // await page.goto('https://www.swyftx.com.au/');
    let API_Key = "ZmjQqIU9xSQgRiHxxH8ifEXjRUquBUtQPN9QiO2pOvFrR"
    let AccessToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJrVTRRelF6TlRaQk5rTkNORGsyTnpnME9EYzNOVEZGTWpaRE9USTRNalV6UXpVNE1UUkROUSJ9.eyJodHRwczovL3N3eWZ0eC5jb20uYXUvLWp0aSI6IjZiODk3ZjQ5LTZiMzItNDE4MC1hNzAwLTI4NDY0MWIwNzM1OSIsImh0dHBzOi8vc3d5ZnR4LmNvbS5hdS8tbWZhX2VuYWJsZWQiOmZhbHNlLCJodHRwczovL3N3eWZ0eC5jb20uYXUvLXVzZXJVdWlkIjoidXNyX1lKc1ZMTFFGR3pUQjNDNGluamJrN00iLCJodHRwczovL3N3eWZ0eC5jb20uYXUvLWNvdW50cnlfbmFtZSI6IkF1c3RyYWxpYSIsImh0dHBzOi8vc3d5ZnR4LmNvbS5hdS8tY2l0eV9uYW1lIjoiU3lkbmV5IiwiaXNzIjoiaHR0cHM6Ly9zd3lmdHguYXUuYXV0aDAuY29tLyIsInN1YiI6ImF1dGgwfDYzNzRhNTMyZmM3ZjVhMWNjYzNmYmU0MyIsImF1ZCI6Imh0dHBzOi8vYXBpLnN3eWZ0eC5jb20uYXUvIiwiaWF0IjoxNzA0MDIyMjc5LCJleHAiOjE3MDQ2MjcwNzksImF6cCI6IkVRdzNmYUF4T1RoUllUWnl5MXVsWkRpOERIUkFZZEVPIiwic2NvcGUiOiJhcHAuYWNjb3VudC50YXgtcmVwb3J0IGFwcC5hY2NvdW50LmJhbGFuY2UgYXBwLmFjY291bnQucmVhZCBhcHAucmVjdXJyaW5nLW9yZGVycy5yZWFkIGFwcC5hZGRyZXNzLnJlYWQgYXBwLmZ1bmRzLnJlYWQgYXBwLm9yZGVycy5yZWFkIGFwcC5hcGkucmVhZCBvZmZsaW5lX2FjY2VzcyIsImd0eSI6InBhc3N3b3JkIn0.wnZMBbZh9bRKyVSn-sVJB7AEzYO5rdPqWwnBpAWojqokRC8E1L83FbLLcLTIKRcLo4hwHMt4De2Kx1ezKhE_l9eZ2HXxQeqvRwXKgdVhvJJZvRrDSBSF1Iq5Ks9kpX6pwaX5nmlXt2f7zvuQODMMhj2TD1dPx-yaEQG4nJ42oz1TJRGtkbTh_fjYHVhzCSRyZtHRoqcEluxDS3jgXx6SvJUbob80MLcGwo6wA7oMEqiM_24rEHeP4jal2s5Joym97L6haU-_IOygsOf8YBNcUOitqN8fq42C2NhafKODKc6tV6Km_3KoL9ZZW_uiPdmMYvVgMqP90vCta94jDGtiRg"

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    };

    const data = `{ "apiKey": "${API_Key}" }`;
    console.log(options,data)

    const request = httpRequest.request('https://api.swyftx.com.au/auth/refresh/', options, response => {
        console.log('Status', response.statusCode);
        console.log('Headers', response.headers);
        let responseData = '';

        response.on('data', dataChunk => {
            responseData += dataChunk;
        });
        response.on('end', () => {
            console.log('Response: ', responseData)
        });
    });

    request.on('error', error => console.log('ERROR', error));

    request.write(data);
    request.end();
});

