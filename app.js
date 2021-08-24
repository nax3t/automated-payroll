if (process.env.NODE_EV !== "production") require("dotenv").config();
const testing = true;
const octokitCore = require("@octokit/core");
const { Octokit } = octokitCore;
const octokit = new Octokit({
  auth: process.env.GH_AUTH_TOKEN,
});
const axios = require("axios");
const colors = require("colors");
const tnb = require("thenewboston");
const { Account } = tnb;
const verifiedUsers = [
  22790904, // manishram (Manish)
  77364430, // tspearing (Tristan)
];
if (testing) verifiedUsers.push(6356890); //nax3t (Ian) - for testing

(async () => {
  try {
    // prepare senders account
    const sendersAccount = new Account(process.env.SIGNING_KEY);

    const bankUrl = "http://45.33.60.42";
    const paymentHandlerOptions = {
      account: sendersAccount,
      bankUrl: bankUrl,
    };
    const bank_config_res = await axios.get(`${bankUrl}/config`);
    let pvUrl = bank_config_res.data.primary_validator.ip_address;
    let validatorFee =
      bank_config_res.data.primary_validator.default_transaction_fee;
    let bankFee = bank_config_res.data.default_transaction_fee;

    const paymentHandler = new tnb.AccountPaymentHandler(paymentHandlerOptions);
    // // This is very important.
    // // Method for getting the Bank and Primary validator Transactions fees
    await paymentHandler.init();
    // get core-team data
    const response = await axios.get(
      "https://api.thenewboston.com/core_members"
    );
    const teamMembers = response.data.results;
    // initialize empty array for bank transactions
    const txs = [];
    const owner = testing ? "nax3t" : "thenewboston-developers";
    const repo = testing ? "test-timesheets" : "Contributor-Payments";

    // get all issues that are labeled as Timesheets, Approved, and Ready to pay
    const { data } = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=Timesheet,%F0%9F%98%8D%20Approved%20%F0%9F%98%8D,Ready%20to%20pay`
    );
    for (const issue of data) {
      // destructure needed properties from issue object
      const { body, number, title, user, html_url, events_url } = issue;
      // check if Ready to pay label added by correct user
      const { data } = await axios.get(events_url);
      const isValidLabel = data.find(
        (action) =>
          action.label &&
          action.label.name === "Ready to pay" &&
          verifiedUsers.includes(action.actor.id)
      );
      // if label not added by correct user then skip to next issue
      if (!isValidLabel) {
        console.log(
          `Invalid label creator for ${title}, skipping to next timesheet.`
        );
        console.log(events_url);
        continue;
      }
      // parse recipient account number
      const recipient = body.match(/[a-z0-9]{64}/)
        ? body.match(/[a-z0-9]{64}/)[0]
        : false;
      // Find number of hours that come after Total Time Spent
      let totalTimeSpent = body.match(
        /total time spent\r\n *\.?\d+\.?(0|5)? *hour/i
      )
        ? body.match(/total time spent\r\n *\.?\d+\.?(0|5)? *hour/i)[0]
        : 0;
      // If totalTimeSpent doesn't exist then check again, but use Time Spent instead of Total Time Spent and pull last one in the array
      if (!totalTimeSpent) {
        const timeSpent = body.match(/time spent\r\n *\.?\d+\.?(0|5)? *hour/i);
        totalTimeSpent =
          timeSpent && timeSpent.input
            ? timeSpent[0]
            : timeSpent && timeSpent.length > 1
            ? timeSpent[timeSpent.length - 1]
            : 0;
      }
      totalTimeSpent = totalTimeSpent
        ? totalTimeSpent.match(/\.?\d+\.?(0|5)?/)[0]
        : 0;
      // pull username and match from teamMembers to pull hourly rate
      const member = teamMembers.find((member) => {
        if (
          member.user.github_username === user.login ||
          title
            .toLowerCase()
            .includes(member.user.display_name.toLowerCase()) ||
          member.user.account_number === recipient
        ) {
          return member;
        }
      });
      const rate = member && member.hourly_rate ? member.hourly_rate : 0;
      // calculate amount to be paid
      const amount = rate * totalTimeSpent;
      const issueId = number;
      let date = title.match(/\d\d\/\d\d\/\d\d\d\d/);
      date = date ? date[0].replace(/\//g, "_") : false;
      // generate memo
      const memo = date ? `TNB_TS_${issueId}_${date}` : false;
      if (amount >= 10000) {
        console.log(
          paymentMessage(
            false,
            html_url,
            amount,
            recipient,
            memo,
            "Payment of 10000 TNBC or more!"
          ).yellow
        );
      } else {
        let totalTxFees = bankFee + validatorFee;
        let { data } = await axios.get(
          `${pvUrl}/accounts/${sendersAccount.accountNumberHex}/balance?format=json`
        );
        let senderBalance = data.balance;
        if (senderBalance > amount + totalTxFees) {
          if (amount && memo && recipient && isValidLabel) {
            // send individual transaction here
            // You can use this method to send memos as well
            try {
              let res = await paymentHandler.sendCoins(recipient, amount, memo);

              if (typeof res === "undefined") {
                console.log(
                  paymentMessage(true, html_url, amount, recipient, memo).green
                );
              } else {
                console.log(
                  paymentMessage(false, html_url, amount, recipient, memo, err)
                    .red
                );
                continue;
              }
            } catch (err) {
              console.log(
                paymentMessage(false, html_url, amount, recipient, memo, err)
                  .red
              );
              continue;
            }
            // upon successful transaction, update issue labels
            // add paid
            await octokit.request(
              "POST /repos/{owner}/{repo}/issues/{issue_number}/labels",
              {
                owner,
                repo,
                issue_number: issueId,
                labels: ["💰 Paid 💰"],
              }
            );
            // remove Ready to pay
            await octokit.request(
              "DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}",
              {
                owner,
                repo,
                issue_number: issueId,
                name: "Ready to pay",
              }
            );
            // close the issue
            await octokit.request(
              "PATCH /repos/{owner}/{repo}/issues/{issue_number}",
              {
                owner,
                repo,
                issue_number: issueId,
                state: "closed",
              }
            );
          } else {
            console.log(
              `Payment not made, missing data for:
                    Type of payment: Timesheet
                    Issue link: ${html_url}
                    Amount: ${amount}
                    Receiver account address: ${recipient}
                    Memo: ${memo}
                    ------------------------`.red
            );
          }
        } else {
          console.log(
            `Payment not made, low balance!!
    Type of payment: Timesheet
    Issue link: ${html_url}
    Amount: ${amount}
    Receiver account address: ${recipient}
    Memo: ${memo}

    ------------------------
    Available Balance: ${data}
    Minimum Required Balance: ${amount + totalTxFees}
    ------------------------`.red
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
})();

function paymentMessage(success, html_url, amount, recipient, memo, err) {
  return `Payment ${success ? "succeeded" : "failed"}!
    Type of payment: Timesheet
    Issue link: ${html_url}
    Amount: ${amount}
    Receiver account address: ${recipient}
    Memo: ${memo}
    ${err ? "Error: " + err : ""}
    ------------------------`;
}
