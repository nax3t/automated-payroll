# The New Boston - Core Team Automated Payroll Script

### Script Notes:
- The script will automatically pull up all the issues from thenewboston-github repositories, where payments need to do, with the Ready to pay label added to them and in the open state.
    - [ ] Step needed to check that label added by correct user
    - [ ] Need to update the label being used in the code to pull in issues from the API
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
- [ ] Payment by the script:
- [ ] Send coins to the contributor
- [ ] Confirm transaction is successful
- [ ] Add Paid label to the issue
- [ ] Remove Ready to pay label to the issue
- [ ] Close the issue
- [ ] Print all successful and failed payments