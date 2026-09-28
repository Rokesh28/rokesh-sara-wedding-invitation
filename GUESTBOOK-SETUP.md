# Shared guestbook setup

The wish wall uses a Google Sheet and a small Apps Script web app. Once connected, every visitor can read and add wishes; recent wishes appear first. Wishes are public on the invitation, so ask guests not to include phone numbers, addresses, or other private details. You can remove any row from the `Wishes` sheet if needed.

## One-time setup

1. Create a Google Sheet for the wishes. Copy the ID from its URL: `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`.
2. Go to [script.google.com](https://script.google.com/) and create a new Apps Script project. Replace its starter code with the contents of `wishes-apps-script.gs`.
3. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` at the top of the script with the sheet ID from step 1, then save.
4. Choose **Deploy → New deployment → Web app**. Set **Execute as** to **Me** and **Who has access** to **Anyone, even anonymous**. This allows guests to post without signing into Google. Deploy and approve the requested Sheets permission. Google documents web-app deployment [here](https://developers.google.com/apps-script/guides/web). Google documents the web-app deployment settings [here](https://developers.google.com/apps-script/guides/web).
5. The deployed `/exec` URL you shared is already set in `guestbook-config.js` in both local invitation copies. If you redeploy and receive a different URL, replace that setting in the copy you plan to publish.
6. Refresh the page. Guest wishes will load from the sheet and new submissions will be added there.

If Google Workspace policy does not allow anonymous web-app access, guests will not be able to submit without signing in. The Google Sheet itself does not need to be shared with guests.
