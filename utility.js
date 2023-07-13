const fs = require('fs');
const path = require('path');
const folderPath = './'; // Specify the folder path

module.exports = {
    WaitMessage: function(additional = "")
    {
        const waitMessage = {
            msgType: 'Wait',
            additional: additional
        };

        return JSON.stringify(waitMessage);
    },

     createTextFile: function(folderPath, fileName, content) {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      
        const filePath = path.join(folderPath, fileName);
      
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            console.error('Error creating the text file:', err);
          } else {
            console.log(`Text file "${fileName}" created successfully in "${folderPath}"`);
          }
        });
      },


    generatePIN: function() {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let pin = '';
      
        for (let i = 0; i < 10; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          pin += characters[randomIndex];
        }
      
        return pin;
      }
}