const { access } = require('fs');
const axios = require('axios').default;
let API_Key = "ZmjQqIU9xSQgRiHxxH8ifEXjRUquBUtQPN9QiO2pOvFrR"

async function getAccessToken() {
    try {
        const response = await axios.post(
            "https://api.swyftx.com.au/auth/refresh/",
            { apiKey: API_Key });
        return response.data.accessToken;
    } catch (error) {
        console.log(error);
    }
}

async function getBalance(accessToken) {
    try {
        const response = await axios.get(
            "https://api.swyftx.com.au/user/balance/", {
            "headers": {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${accessToken}`
            }
        });
        // [
        //     { assetId: 1, availableBalance: '0', stakingBalance: '0' },
        //     { assetId: 2, availableBalance: '0', stakingBalance: '0' },
        //     {
        //       assetId: 3,
        //       availableBalance: '0.019820594506406805',
        //       stakingBalance: '0'
        //     }
        //   ]
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

async function getLiveRates() {
    try {
        const response = await axios.get("https://api.swyftx.com.au/markets/info/basic/");
        return response.data.reduce((acc, r) => ({ ...acc, [r["id"]]: r }), {});
        // '3': {
        //     name: 'Bitcoin',
        //     altName: 'Bitcoin',
        //     code: 'BTC',
        //     id: 3,
        //     rank: 1,
        //     buy: '62807.70675005',
        //     sell: '62200.78267905',
        //     spread: '0.97',
        //     volume24H: 13880352943,
        //     marketCap: 566141994744
        //   },

    } catch (error) {
        console.log(error);
    }
}

async function doit() {
    let balances = await getBalance(await getAccessToken())
    let rates = await getLiveRates()

    for (const ownedAsset of balances) {
        let id = ownedAsset["assetId"]
        if (rates[id]) {
            let myBalance = rates[id]["sell"] * ownedAsset["availableBalance"]
            if (myBalance && myBalance > 0) {
                console.log(`Balance of ${rates[id]["name"]} (${rates[id]["code"]}): $${myBalance}`)
            }

        }
    }
    // console.log(balances)
    // console.log(rates)
}

doit()