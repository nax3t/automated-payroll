const fs = require('fs');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);
const axios = require('axios');
const { time } = require('console');
const issueIds = process.argv.slice(2);
(async () => {
    try {
        await writeFile('file.csv', '');
        const response = await axios.get('https://api.thenewboston.com/core_members');
        const teamMembers = response.data.results;
        for (const issueId of issueIds) {
            const { data } = await axios.get(`https://api.github.com/repos/thenewboston-developers/Contributor-Payments/issues/${issueId}`);
            const { labels, html_url, title, body, user } = data;
            let timesheetApproved = labels.find(label => label.description === 'Approved' && label.name.includes('Approved'));
            timesheetApproved = timesheetApproved ? 'Yes' : 'No';
            const slashDate = title.match(/\d\d\/\d\d\/\d\d\d\d/);
            const date = slashDate ? slashDate[0].replace(/\//g, '_') : false;
            const contributor = title.split('-')[2].trim();
            const timesheetGithubLink = html_url;
            let totalTimeSpent = body.match(/total time spent\r\n *\.?\d+\.?(0|5)? *hour/i) ? body.match(/total time spent\r\n *\.?\d+\.?(0|5)? *hour/i)[0] : 0;
            if (!totalTimeSpent) {
                const timeSpent = body.match(/time spent\r\n *\.?\d+\.?(0|5)? *hour/i);
                totalTimeSpent = timeSpent && timeSpent.input ? timeSpent[0] : timeSpent && timeSpent.length > 1 ? timeSpent[timeSpent.length - 1] : 0;
            }
            totalTimeSpent = totalTimeSpent ? totalTimeSpent.match(/\.?\d+\.?(0|5)?/)[0] : 0;
            const accountNumber = body.match(/[a-z0-9]{64}/) ? body.match(/[a-z0-9]{64}/)[0] : false;
            
            const memoNote = `TNB_TS_${issueId}_${date}`;
    
            const member = teamMembers.find(member => {
                if (member.user.github_username === user.login ||
                    title.toLowerCase().includes(member.user.display_name.toLowerCase()) ||
                    member.user.account_number === accountNumber) {
                    return member;
                }
            });
            const hourlyRate = member && member.hourly_rate ? member.hourly_rate : 0;
            const totalPay = hourlyRate * totalTimeSpent;
            const csvRow = `${slashDate}, ${contributor}, ${timesheetApproved}, ${timesheetGithubLink}, ${hourlyRate}, ${totalTimeSpent}, ${totalPay}, ${accountNumber}, ${memoNote}\n`;
            // append data to a file
            await appendFile('file.csv', csvRow);
        }
    } catch (err) {
        console.log('ERROR', err);
    }
})();
