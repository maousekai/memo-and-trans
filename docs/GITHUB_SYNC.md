# GitHub Sync for LexiGlass

GitHub Sync lets the desktop app publish your saved vocabulary, phrases, FSRS state, mastery and error counters to a private repository. ChatGPT can then read that repository through your GitHub connection.

## One-time GitHub setup

1. Open GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Use any descriptive name, for example `LexiGlass Sync`.
3. Homepage URL can be the public URL of the LexiGlass source repository.
4. GitHub requires an Authorization callback URL for an OAuth App. It is not used by the Device Flow, so a placeholder HTTPS URL is sufficient.
5. After creating the OAuth App, enable **Device Flow** in the app settings.
6. Copy the **Client ID**. Do not create or paste a client secret into LexiGlass.

## Connect LexiGlass

1. Open **LexiGlass → Cài đặt → GitHub Sync**.
2. Paste the OAuth Client ID.
3. Keep the default private repo name `memo-and-trans-data` or choose another one.
4. Click **Đăng nhập GitHub**.
5. Open the verification page, enter the displayed device code, and authorize access.
6. Return to LexiGlass and click **Tôi đã xác nhận**.
7. Turn on **Tự động đồng bộ**.

LexiGlass requests `repo read:user` so it can create and update the private sync repository and identify the signed-in account.

The access token is stored in the operating-system keyring (Windows Credential Manager), not in localStorage.

## Synced file

The app writes:

`data/learning-data.json`

The JSON includes:

- saved words and dictionary metadata
- saved phrases
- mastery and learning stage
- FSRS scheduling state
- review history
- weakness/error counters

The repo is created as **private** when it does not already exist.

## ChatGPT access

Connect GitHub to ChatGPT and make sure the ChatGPT GitHub integration has access to the private sync repository. If your GitHub installation is configured for **selected repositories**, you may need to add the newly-created sync repository once.

Then requests can be phrased naturally, for example:

- “Lấy 20 từ mới nhất trong memo-and-trans-data để ôn TOEIC.”
- “Cho tôi ôn những từ có mastery dưới 50.”
- “Tạo Part 5 từ những từ tôi hay sai về word form.”
- “Ôn các từ có listeningErrors cao nhất.”
