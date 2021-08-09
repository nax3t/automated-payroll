# The New Boston - Core Team Automated Payroll Script

### Pseudo code notes:
- The script will automatically pull up all the issues from thenewboston-github repositories, where payments need to do, with the Ready to pay label added to them and in the open state. 
- Collect this info from issues:
- Contributor account address
- Amount to be paid - Need to add more details here
- Types of payment: Core team payment / Bounty / Project
- Issue id
- Generate appropriate memo for each payment based on standard memo format
- Print payment sheet. Highlight those issues with more than 10000TNBC to be sent at once.
- Payer will run the pay command after reviewing the payment sheet.
- Payment by the script:
- Send coins to the contributor
- Confirm transaction is successful
- Add Paid label to the issue
- Remove Ready to pay label to the issue
- Close the issue
- Print all successful and failed payments