import { Resend } from 'resend'

const isProd = process.env.NODE_ENV === 'production'
const resend = isProd && process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.FROM_EMAIL ?? 'grocery@example.com'
const APP_URL = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`\n📧 [DEV EMAIL] To: ${to}\n   Subject: ${subject}\n   ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`)
    return
  }
  await resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendListCreatedEmail(to: string, list: { id: string; name: string }) {
  const url = `${APP_URL}/list/${list.id}`
  await send(to, 'Your grocery list is ready', `
    <p>Your grocery list <strong>${list.name}</strong> is ready.</p>
    <p><a href="${url}" style="background:#FF8811;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Open your list</a></p>
    <p style="margin-top:16px;">Or copy this link to share with others:</p>
    <p><code>${url}</code></p>
    <p style="font-size:12px;color:#888;margin-top:24px;">Save this email — you can use it to find your list again later.</p>
  `)
}

export async function sendOtpEmail(to: string, code: string) {
  await send(to, `Your login code: ${code}`, `
    <p>Enter this code to sign in to Grocery List:</p>
    <p style="font-size:2rem;font-weight:bold;letter-spacing:0.2em;margin:16px 0;">${code}</p>
    <p style="color:#888;font-size:14px;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
  `)
}

export async function sendInviteEmail(to: string, inviterEmail: string, list: { id: string; name: string }) {
  const url = `${APP_URL}/list/${list.id}`
  await send(to, `${inviterEmail} shared a grocery list with you`, `
    <p><strong>${inviterEmail}</strong> has added you to their grocery list: <strong>${list.name}</strong>.</p>
    <p><a href="${url}" style="background:#FF8811;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Open list</a></p>
    <p style="font-size:12px;color:#888;margin-top:16px;">Sign in with your email address to access it.</p>
  `)
}

export async function sendRecoveryEmail(to: string, lists: Array<{ id: string; name: string }>) {
  if (lists.length === 0) return
  const listItems = lists
    .map(l => `<li><a href="${APP_URL}/list/${l.id}">${l.name}</a></li>`)
    .join('\n')
  await send(to, 'Your grocery lists', `
    <p>Here are the grocery lists associated with your email address:</p>
    <ul style="line-height:2;">${listItems}</ul>
  `)
}
