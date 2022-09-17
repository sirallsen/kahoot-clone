module.exports = {
    WaitMessage: function(additional = "")
    {
        const waitMessage = {
            msgType: 'Wait',
            additional: additional
        };

        return JSON.stringify(waitMessage);
    }
}