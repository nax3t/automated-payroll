if (process.env.NODE_EV !== "production") require("dotenv").config();
const testing = process.env.TESTING;
const octokitCore = require("@octokit/core");
const { Octokit } = octokitCore;
const octokit = new Octokit({
    auth: process.env.GH_AUTH_TOKEN,
});
const axios = require('axios');
const tnb = require('thenewboston');
const { Account } = tnb;
const cron = require("node-cron");
const verifiedUsers = [
    22790904, // manishram (Manish)
    77364430, // tspearing (Tristan)
];
// extend console.log and add discord webhook
const originalLogger = console.log;
console.log = async function () {
    try {
        await axios.post(process.env.WEBHOOK_URL,
            {
                content: Object.values(arguments).join(' ')
            })
        originalLogger.apply(this, ['Successfully posted to Discord']);
    } catch (err) {
        originalLogger.apply(this, [`Discord Error: ${err.message}`]);
    }
    originalLogger.apply(this, arguments);
}
if (testing.toString().toLowerCase() !== false) {
    console.log('```diff\n' +
        '- Script running in testing mode\n' +
        '```');
    verifiedUsers.push(6356890); //nax3t (Ian) - for testing
}

const main = async () => {
    try {
        // prepare senders account
        const sendersAccount = new Account(process.env.SIGNING_KEY);
        const bankUrl = 'http://54.183.16.194';
        const paymentHandlerOptions = {
            account: sendersAccount,
            bankUrl: bankUrl,
        };
        const paymentHandler = new tnb.AccountPaymentHandler(paymentHandlerOptions);
        // // This is very important.
        // // Method for getting the Bank and Primary validator Transactions fees
        await paymentHandler.init();
        // get core-team data
        const response = await axios.get('https://api.thenewboston.com/core_members');
        const teamMembers = response.data.results;
        // initialize empty array for bank transactions
        const txs = [];
        const owner = testing ? 'nax3t' : 'thenewboston-developers';
        const repo = testing ? 'test-timesheets' : 'Contributor-Payments';

        // get all issues that are labeled as Bounty Payment, Approved, and Ready to pay
        const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=Bounty%20Payment,%F0%9F%98%8D%20Approved%20%F0%9F%98%8D,Ready%20to%20pay`, {
            headers: {
                'Authorization': `token ${process.env.GH_AUTH_TOKEN}`
            }
        });
        for (const issue of data) {
            // destructure needed properties from issue object
            const { body, number, title, user, html_url, events_url } = issue;
            const issueId = number;
            // check if Ready to pay label added by correct user
            const { data } = await axios.get(events_url, {
                headers: {
                    'Authorization': `token ${process.env.GH_AUTH_TOKEN}`
                }
            });
            const isValidLabel = data.find(action =>
                action.label &&
                action.label.name === 'Ready to pay' &&
                verifiedUsers.includes(action.actor.id)
            );
            // if label not added by correct user then skip to next issue
            if (!isValidLabel) {
                console.log(`2 Invalid label creator for ${title}, skipping to next bounty payment.`);
                console.log(3, events_url);
                continue;
            }
            // // parse recipient account number
            const recipients = body.match(/\d+ *- *[a-z0-9]{64} *- *thenewboston-developers\/\w+-*\w*-*\w*-*\w*-*\w*#\d+/g);
            // if no recipients matched then skip to next issue
            if (!recipients) {
                console.log(`4 No recipients matched for ${title}, skipping to next bounty payment.`);
                console.log(5, events_url);
                continue;
            }
            let allPaid = true;
            for (let recipient of recipients) {
                recipient = recipient.split('-').map(r => r.trim());
                const amount = Number(recipient.shift());
                const accountNo = recipient.shift();
                const issue = recipient.join('-');
                const bountyIssueId = Number(issue.split('#').pop());
                recipient = accountNo;
                // generate memo
                const memo = issueId && bountyIssueId ? `TNB_BOUNTY_${issueId}_${bountyIssueId}` : false;
                if (amount && amount >= 10000) {
                    allPaid = false;
                    console.log(6, paymentMessage(false, html_url, amount, recipient, memo, 'Payment of 10000 TNBC or more!'));
                } else {
                    if (amount && memo && recipient && isValidLabel) {
                        // send individual transaction here
                        // You can use this method to send memos as well
                        try {
                            let res = await paymentHandler.sendCoins(recipient, amount, memo);
                            if (typeof res === 'undefined') {
                                console.log(7, paymentMessage(true, html_url, amount, recipient, memo));
                            } else {
                                allPaid = false;
                                console.log(8, paymentMessage(false, html_url, amount, recipient, memo, err));
                                continue;
                            }
                        } catch (err) {
                            allPaid = false;
                            console.log(9, paymentMessage(false, html_url, amount, recipient, memo, err));
                            continue;
                        }
                    } else {
                        allPaid = false;
                        console.log(`10 ------------------------
                        Payment not made, missing data for:
                        Type of payment: Bounty Payment
                        Issue link: ${html_url}
                        Amount: ${amount}
                        Receiver account address: ${recipient}
                        Memo: ${memo}
                        ------------------------`);
                    }
                }
            }
            // after all transactions are completed, update issue labels
            if (!allPaid) {
                console.log('11 Warning: One or more payment not completed, please see logs above.');
                // add requires manual review
                await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
                    owner,
                    repo,
                    issue_number: issueId,
                    labels: ['Requires Manual Review']
                });
            } else {
                // add paid
                await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
                    owner,
                    repo,
                    issue_number: issueId,
                    labels: ['💰 Paid 💰']
                });
                // close the issue
                await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
                    owner,
                    repo,
                    issue_number: issueId,
                    state: 'closed'
                });
            }
            // remove Ready to pay
            await octokit.request('DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}', {
                owner,
                repo,
                issue_number: issueId,
                name: 'Ready to pay'
            });
        }
        return;
    } catch (err) {
        console.log(12, err.message);
    }
};


function paymentMessage(success, html_url, amount, recipient, memo, err) {
    const color = success ? '+' : '-';
    return `\`\`\`diff
${color} ------------------------
${color} Payment ${success ? 'succeeded' : 'failed'}!
${color} Type of payment: Bounty Payment
${color} Issue link: ${html_url}
${color} Amount: ${amount}
${color} Receiver account address: ${recipient}
${color} Memo: ${memo}
${color} ${err ? 'Error: ' + err.message + '\n- ------------------------' : '------------------------'}
\`\`\``;
};

main();
// see docs: https://github.com/ncb000gt/node-cron
// run function once a week on mondays
// cron.schedule('*/5 * * * * *', () => {
    // console.log('This runs every 5 seconds');
    // main();
// });
