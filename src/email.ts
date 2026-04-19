import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'grocery@example.com'
const APP_URL = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export async function sendListCreatedEmail(to: string, list: { id: string; name: string }) {
  const url = `${APP_URL}/list/${list.id}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your grocery list is ready',
    html: `
      <p>Your grocery list <strong>${list.name}</strong> is ready.</p>
      <p><a href="${url}" style="background:#FF8811;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Open your list</a></p>
      <p style="margin-top:16px;">Or copy this link to share with others:</p>
      <p><code>${url}</code></p>
      <p style="font-size:12px;color:#888;margin-top:24px;">Save this email — you can use it to find your list again later.</p>
    `,
  })
}

export async function sendRecoveryEmail(to: string, lists: Array<{ id: string; name: string }>) {
  if (lists.length === 0) return
  const listItems = lists
    .map(l => `<li><a href="${APP_URL}/list/${l.id}">${l.name}</a></li>`)
    .join('\n')
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your grocery lists',
    html: `
      <p>Here are the grocery lists associated with your email address:</p>
      <ul style="line-height:2;">${listItems}</ul>
    `,
  })
}
