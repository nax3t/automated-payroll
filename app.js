// const octokitCore = require('@octokit/core');
// const { Octokit } = octokitCore;
// const octokit = new Octokit({
    //   auth: 'PERSONAL_GH_AUTH_TOKEN_HERE',
// });
const axios = require('axios');
// const sendersAccount = new Account("fakeSigningKey");
// const bankUrl = "http://18.218.193.164";

// const paymentHandlerOptions = {
//   account: sendersAccount,
//   bankUrl: bankUrl,
// };

// const paymentHandler = new tnb.AccountPaymentHandler(paymentHandlerOptions);

// // This is very important.
// // Method for getting the Bank and Primary validator Transactions fees
// await paymentHandler.init();

(async()=> {
    try {
        const txs = [];
        // const { data } = await octokit.request('GET /issues');
        const { data } = await axios.get('https://api.github.com/repos/thenewboston-developers/Contributor-Payments/issues?state=open&labels=Timesheet,%F0%9F%93%9D%20Ready%20for%20Review%F0%9F%93%9D');
        for(const issue of data) {
            const { body, number, title } = issue;
            // parse recipient account number
            const recipient = body.match(/[a-z0-9]{64}/) ? body.match(/[a-z0-9]{64}/)[0] : false;
            let totalTimeSpent = body.match(/total time spent\r\n\d+\.*\.?5? hour/i) ? body.match(/total time spent\r\n\d+\.*\.?5? hour/i)[0] : false;
            totalTimeSpent = totalTimeSpent ? totalTimeSpent.match(/\d+\.*\.?5?/)[0] : false;
            // need users to include their rate or need to pull from another data source
            const rate = 800;
            // calculate amount to be paid
            const amount = rate * totalTimeSpent;
            const issueId = number;
            let date = title.match(/\d\d\/\d\d\/\d\d\d\d/);
            date = date ? date[0].replace(/\//g, '_') : false;
            // generate memo
            const memo = `TNB_TS_${issueId}_${date}`;
            txs.push({
                amount,
                memo,
                recipient,
            });
        }
        console.log('Transaction Data for Bulk Payment:', txs);
        // send bulk payments to the blockchain
        // await sendBulkPayments(txs);
    } catch(err) {
        console.log(err);
    }
})();