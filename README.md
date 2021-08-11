# The New Boston - Core Team Automated Payroll Script

### Script Notes:
- The script will automatically pull up all the issues from thenewboston-github repositories, where payments need to do, with the Ready to pay label added to them and in the open state.
    - [X] Check that 'Ready to pay' label added by correct user
    - [ ] Update id being used for 'Ready to pay' label user check
    - [X] Need to update the labels being used in the code to pull in Ready to Pay Timesheet issues from the API
- Collect this info from issues and core members API:
    - [x] Contributor account address
    - [x] Hourly Rate
    - [x] Total time spent
    - [ ] Types of payment: Core team payment / Bounty / Project
    - [x] Issue id
- [x] Print any transactions where insufficient data is available to make a valid transaction, e.g., no hourly rate
- [x] Generate appropriate memo for each payment based on standard memo format
- [ ] Print payment sheet. Highlight those issues with more than 10000TNBC to be sent at once.
- [ ] Payer will run the pay command after reviewing the payment sheet.
    - [ ] Use either a mailer notification or create a new github issue for these kinds of manual verification payments
- [ ] Payment by the script:
- [ ] Send coins to the contributor
- [ ] Confirm transaction is successful
- [x] Add Paid label to the issue
- [x] Remove Ready to pay label to the issue
- [x] Close the issue
- [ ] Print all successful and failed payments
- [ ] Use agenda js to create a background job that runs the script daily on a production server