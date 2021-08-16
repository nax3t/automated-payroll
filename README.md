# The New Boston - Core Team Automated Payroll Script

## To run:
- clone repo and install dependencies
    - `git clone git@github.com:nax3t/automated-payroll.git`
    - `cd automated-payroll`
    - `npm install`
- Rename example.env to .env and populate with required values
- Change testing variable to false in app.js (if not already false)
- Run the program with `node app.js`

## Error key:
- green: payment succeeded
- red: payment failed (see error)
- yellow: payment held for manual review due to amount over 10,000 TNBC

### Script Notes:
- The script will automatically pull up all the issues from thenewboston-github repositories, where payments need to do, with the Ready to pay label added to them and in the open state.
    - [X] Check that 'Ready to pay' label added by correct user
    - [x] Update ids being used for 'Ready to pay' label user check
    - [X] Need to update the labels being used in the code to pull in Ready to Pay Timesheet issues from the API
- Collect this info from issues and core members API:
    - [x] Contributor account address
    - [x] Hourly Rate
    - [x] Total time spent
    - [ ] Types of payment: Core team payment / Bounty / Project
    - [x] Issue id
- [x] Print any transactions where insufficient data is available to make a valid transaction, e.g., no hourly rate
- [x] Generate appropriate memo for each payment based on standard memo format
- [x] Print payment sheet. Highlight those issues with more than 10000TNBC to be sent at once.
- [ ] Payer will run the pay command after reviewing the payment sheet.
    - [ ] Use either a mailer notification or create a new github issue for these kinds of manual verification payments
- [x] Payment by the script:
- [x] Send coins to the contributor
- [x] Confirm transaction is successful
- [x] Add Paid label to the issue
- [x] Remove Ready to pay label to the issue
- [x] Close the issue
- [x] Print all successful and failed payments
- [ ] Use agenda js to create a background job that runs the script daily on a production server