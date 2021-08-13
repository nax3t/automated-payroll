const axios = require('axios');
const issueId = 'PASTE_ISSUE_ID_HERE';
(async () => {
    try {
        const response = await axios.get('https://api.thenewboston.com/core_members');
        const teamMembers = response.data.results;
        const { data } = await axios.get(`https://api.github.com/repos/thenewboston-developers/Contributor-Payments/issues/${issueId}`);
        const { labels, html_url, title, body, user } = data;
        let timesheetApproved = labels.find(label => label.name === '😍+Approved+😍');
        timesheetApproved = timesheetApproved ? 'Yes' : 'No';
        let date = title.match(/\d\d\/\d\d\/\d\d\d\d/);
            date = date ? date[0].replace(/\//g, '_') : false;
        const contributor = title.split(' - ')[2];
        const timesheetGithubLink = html_url;
        let totalTimeSpent = body.match(/total time spent\r\n\.?\d+\.?(0|5)? hour/i) ? body.match(/total time spent\r\n\.?\d+\.?(0|5)? hour/i)[0] : 0;
        if (!totalTimeSpent) {
            const timeSpent = body.match(/time spent\r\n\.?\d+\.?(0|5)? hour/i);
            totalTimeSpent = timeSpent && timeSpent.input ? timeSpent[0] : timeSpent && timeSpent.length > 1 ? timeSpent[timeSpent.length - 1] : 0;
        }
        totalTimeSpent = totalTimeSpent ? totalTimeSpent.match(/\d+\.?(0|5)?/)[0] : 0;
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
        console.log(`${date}, ${contributor}, ${timesheetApproved}, ${timesheetGithubLink}, ${hourlyRate}, ${totalTimeSpent}, Total Pay, ${accountNumber}, ${memoNote}`);
    } catch (err) {
        console.log('ERROR', err);
    }
})();
