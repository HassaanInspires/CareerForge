export async function sendSlackNotification(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `🔔 *CareerForge Alert*\n${message}`
            }
          }
        ]
      })
    });
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
  }
}
