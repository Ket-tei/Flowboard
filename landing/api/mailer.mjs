import nodemailer from "nodemailer";
import { MIN_RAM_BYTES, MIN_DISK_BYTES } from "./resources.mjs";

const ALERT_TO = process.env.ALERT_EMAIL_TO ?? "admin@canope.org";
const SMTP_FROM = process.env.SMTP_USER ?? "automation@canope.org";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function toGB(bytes) {
  if (bytes === Infinity) return "∞";
  return (bytes / 1024 ** 3).toFixed(1);
}

export async function sendResourceAlert({ freeRamBytes, freeDiskBytes, slug, email }) {
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: SMTP_FROM,
      to: ALERT_TO,
      subject: "[Flowboard] Création d'instance refusée — ressources insuffisantes",
      text: [
        "Une tentative de création d'instance a été refusée par manque de ressources serveur.",
        "",
        `Instance demandée : ${slug}`,
        `Email : ${email}`,
        "",
        `RAM libre : ${toGB(freeRamBytes)} Go (minimum requis : ${toGB(MIN_RAM_BYTES)} Go)`,
        `Disque libre : ${toGB(freeDiskBytes)} Go (minimum requis : ${toGB(MIN_DISK_BYTES)} Go)`,
        "",
        "Veuillez libérer des ressources pour permettre la création de nouvelles instances.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[mailer] Failed to send resource alert:", err.message);
  }
}
